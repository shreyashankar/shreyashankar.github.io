---
title: "Notes on ARIES: A Transaction Recovery Method Supporting Fine-Granularity Locking and Partial Rollbacks Using Write-Ahead Logging"
date: "2022-07-09"
description: ''
tags: ['systems']
---

As part of my preparation for the Berkeley DB prelim exam, I’m finding it helpful to write notes for some of the difficult concepts. This post is about the [ARIES recovery algorithm](https://people.eecs.berkeley.edu/~brewer/cs262/Aries.pdf) (Mohan et al. 1992) — the motivation, data structures needed, and the algorithm itself. 


## Introduction

Databases have _in-memory_ and _disk_ components. A database _transaction_ consists of several operations, like read or write data. Operations are done in memory, and data is persistently saved in disk. 

Recall that a unit of data storage is a _page_. Memory consists of a buffer of pages, which get _dirtied_ with new data when users want to make changes to their data. Dirty pages must then be flushed back to disk, or persistent storage. 

Memory is wiped on system failures or shutdowns. During a crash, data in memory that hasn’t yet been flushed to disk will be lost forever. This poses problems for database users — if the database tells them that they’ve successfully updated their data, but the updates only live in memory, the user can lose their updates if there’s a crash! Thus, as database developers, how can we guarantee _recovery_, or promise that in a crash, the database will eventually reflect a state the user is fully aware of?

Recovery techniques address two of the ACID properties:



* Atomicity: either all or no operations in a transaction persist
* Durability: if the database claims that a transaction commit finishes, the result of the transaction will definitely persist

As an example, suppose you are placing an Amazon shopping order and an Amazon machine loses connection in the middle of the purchase.



* Atomicity: either all the items in the order are purchased or zero of the items are purchased
* Durability: if Amazon confirms the order, you should always be able to see the order in your order history, and you will receive the order

Let’s try to guarantee atomicity first. A simple policy is: only write a transaction’s dirty pages to memory after the transaction has committed. In the Amazon example, this means only write all the ordered items to persistent storage once we’ve confirmed the order. This is called a **no-steal** policy: we can’t “steal” buffer frames of transaction A’s dirty pages for another transaction B unless transaction A has fully completed. No-steal gives us atomicity, but it makes our throughput low — we can’t highly interleave transactions. So we’d like to be able to use a steal policy, or allow Transaction A’s dirty pages to be written to disk before it completes so there’s room for Transaction B to do work. A good recovery technique will allow stealing, but provide some guarantees on atomicity by allowing the _undo_ of bad operations (more later on).

Now, how can we simply guarantee durability? When a transaction commits, we can force all its dirty pages to be flushed to disk. In the Amazon example, this means when Amazon confirms an order, all items should immediately be written to persistent storage. This is called a **force** policy: we force changes to disk as soon as a transaction commits. Force gives us durability, but it is slow: it results in excessive I/O costs, since we must write highly used pages to disk on every commit. So we’d like to be able to use a no-force policy, or allow dirty pages to get flushed to disk on their own time. A good recovery technique will allow no-force, but provide guarantees on durability by allowing the _redo_ of committed transactions (more later on).

To recap, the steal and force approaches can be mixed as follows:


<table>
  <tr>
   <td>
   </td>
   <td><strong>No-Steal</strong>
   </td>
   <td><strong>Steal</strong>
   </td>
  </tr>
  <tr>
   <td><strong>Force</strong>
   </td>
   <td>Bad throughput, bad latency…but guarantees atomicity and durability
   </td>
   <td>Good throughput (a transaction can steal pages from the buffer do work), bad latency (must wait for all dirty pages for a transaction to be flushed to disk after it commits)
   </td>
  </tr>
  <tr>
   <td><strong>No-Force</strong>
   </td>
   <td>Bad throughput (transactions can’t use the buffer if it’s full), good latency (dirty pages for finished transactions can be flushed to disk whenever convenient)
   </td>
   <td>Good throughput, good latency…if we can ensure atomicity and durability somehow
   </td>
  </tr>
</table>


As a database developer, ideally we would use a **steal, no-force** approach. But we’d need to guarantee atomicity and durability somehow if there were a crash. The challenge is: **what extra information do we maintain to, upon crash, reconstruct the database to the state it was in prior to the crash? And how would we use this information to actually reconstruct the database?**


## Logging

Recovery managers in databases typically maintain a _log_ of database modifications. On failure, the log gets replayed to redo committed transactions and undo uncommitted transactions. There are several types of log records:



* UPDATE: making a change to the data
* COMMIT: starting the commit process
* ABORT: starting the abort process
* CLR (compensation log record): an update that happens as a result of an abort (i.e., updates for undone operations). Contains the undo LSN (the LSN of the operation we undid)
* END: ending the commit or abort, finishing a transaction

It is important to make sure the log is persistent, or survives crashes itself. To guarantee atomicity and durability, we have two rules for how we write logs to disk:



* Atomicity: log records must be written to disk before its corresponding transaction’s dirty pages get written to disk. Otherwise, if dirty pages were written to disk before the log records and there was a crash, we would not know what operations to undo because the operations weren’t logged to disk!
* Durability: when a transaction commits, we must write all of its records to disk. Otherwise, if a transaction committed before its records were written to disk and there was a crash, we would not know what records to replay!

These rules are known as the _Write-Ahead Logging_ (WAL) protocol. WAL guarantees that a record of every change to the database is available upon crash.

Now that we know the mechanisms for how to log, we can discuss what to log. Every log record has a _LSN_, or log sequence number. LSNs must be monotonically increasing so we can infer the order of operations from a sequence of LSNs. Every log record also contains a _prevLSN_, which is the LSN from the last operation of the same transaction. The prevLSN is useful when we want to undo transactions (more later). 

Log records contain the following metadata:



* LSN
* prevLSN
* Record Type
* Transaction ID
* Page ID (for UPDATEs only)
* Length (for UPDATEs only)
* Offset (for UPDATEs only)
* Old data (for UPDATEs only, for undo)
* New data (for UPDATEs only, for redo)

Additionally, every log record essentially describes a change made to a page. So, every page contains a new piece of metadata — the _pageLSN_, or the LSN of the most recent log record that describes a change made to it. Since the log is periodically forcibly saved to disk, the database keeps track of the _flushedLSN_, or the maximum LSN saved to disk so far. As a result of WAL (log records must be flushed before their data pages), before a page _i_ is flushed to disk, the inequality flushedLSN >= pageLSN_i always holds.

Now that we know how and what to log, _when_ do we write records to the log? We write a log record after any of the following actions in memory:


<table>
  <tr>
   <td><strong>Transaction Action</strong>
   </td>
   <td><strong>Corresponding Log Modifications</strong>
   </td>
  </tr>
  <tr>
   <td>UPDATE
   </td>
   <td>
<ul>

<li>Initialize a new LSN <em>n</em>

<li>Get previous LSN <em>m</em> in the log corresponding to the same transaction, or set <em>m</em> to null

<li>Append an UPDATE record with LSN <em>n</em> and prevLSN <em>m</em> to the log. Also set the page ID, length, offset, old data, and new data fields in the log record.

<li>Change the pageLSN to <em>n</em>
</li>
</ul>
   </td>
  </tr>
  <tr>
   <td>COMMIT
   </td>
   <td>
<ul>

<li>Initialize a new LSN <em>n</em>

<li>Get previous LSN <em>m</em> in the log corresponding to the same transaction, or set <em>m</em> to null

<li>Append a COMMIT record with LSN <em>n</em> and prevLSN <em>m</em> to the log

<li><strong>Flush the log to disk!</strong>

<li><strong>Refresh flushedLSN</strong>
</li>
</ul>
   </td>
  </tr>
  <tr>
   <td>ABORT
   </td>
   <td>
<ul>

<li>Initialize a new LSN <em>n</em>

<li>Get previous LSN <em>m</em> in the log corresponding to the same transaction, or set <em>m</em> to null

<li>Append an ABORT record with LSN <em>n</em> and prevLSN <em>m</em> to the log

<li>Initiate an undo (i.e., undo each operation in the transaction in reverse order)
</li>
</ul>
   </td>
  </tr>
  <tr>
   <td>CLR
   </td>
   <td>
<ul>

<li>Initialize a new LSN <em>n</em>

<li>Get previous LSN <em>m</em> in the log corresponding to the same transaction, or set <em>m</em> to null

<li>Get undo LSN <em>l</em> for the operation to be undone

<li>Append a CLR record with LSN <em>n</em>, undo LSN <em>l</em>, and prevLSN <em>m</em> to the log
</li>
</ul>
   </td>
  </tr>
  <tr>
   <td>END
   </td>
   <td>
<ul>

<li>Initialize a new LSN <em>n</em>

<li>Get previous LSN <em>m</em> in the log corresponding to the same transaction, or set <em>m</em> to null

<li>Append an END record with LSN <em>n</em> and prevLSN <em>m</em> to the log
</li>
</ul>
   </td>
  </tr>
</table>


That is all the information needed for what to log, when to log, and how to log!


## Recovery Data Structures

We keep two data structures of state in memory — the _transaction table_ and the _dirty page table_ — to ease the recovery process. 

For all _active_ transactions only, the transaction table keeps the following metadata:



* Transaction ID
* Status (in progress, committed, aborted)
* lastLSN (the most recent log record for this transaction, useful for undoing)

For every dirty page in the buffer, the dirty page table keeps the following metadata:



* Page ID
* recLSN (the LSN of the first log record that first dirtied this page; useful for redoing)

The following inequalities hold:



1. Before a transaction T commits, all its logs must be flushed to disk (as a result of WAL), so flushedLSN >= lastLSN_T
2. For a page P in the dirty page table, recLSN_P &lt;= in memory pageLSN_P
3. For a page P in the dirty page table, recLSN_P > on disk pageLSN_P


## ARIES Recovery Algorithm

The previous sections answered the question: what extra information do we maintain to, upon crash, reconstruct the database to the state it was in prior to the crash? In this section, we answer the algorithm question: **how would we use this information to actually reconstruct the database?**

When a database crashes, all we have are the logs that got saved to disk. The ARIES recovery algorithm has 3 phases that occur in the following order:



1. Analysis: reconstruct transaction and dirty page tables
2. Redo: repeat operations (for durability)
3. Undo: undo operations from transactions in-progress during the crash (for atomicity)


### Analysis

In the analysis phase, we scan through the log from the start to reconstruct the transaction and dirty page tables. For each record in the log, we act according to the following rules:



* If the record is not an END:
    * Add transaction to the transaction table if it does not exist
    * Set transaction’s lastLSN to the record’s LSN
* If the record is an UPDATE:
    * If the modified page is not in the DPT, add it to the DPT
    * Set the page’s recLSN to the record’s LSN
* If the record is a COMMIT or an ABORT:
    * Change the transaction’s status accordingly in the transaction table
* If the record is an END:
    * Remove the transaction from the transaction table

Something else to consider is that transactions may have been in the process of running, committing, or aborting at the time of the crash. So we need to do another “final pass” for the transactions in the transaction table. There are two rules to keep in mind for the final pass:



* If the transaction was in the process of committing, we add an END record to the log and remove it from the transactions table. 
* If the transaction was running, we change its status in the transaction table to aborting and add an ABORT record to the log.


### Redo

Once we finish the analysis phase, we start the redo phase to get durability. We begin at the smallest recLSN in the dirty page table and redo following transactions. 

Intuitively, in this phase, we want to redo all operations that did not make it to disk before the crash. The metadata in the transaction and dirty page tables will help us determine whether the operation made it to disk before the crash.

We redo all UPDATE and CLR operations that do not meet _any_ of the following criteria:



* The page is not in the DPT — meaning the change must have been flushed to disk before the crash
* The corresponding pageLSN on disk >= current record’s LSN — meaning at least the current operation (and possibly some future operation) must have made it to disk before the crash
* The corresponding recLSN in the dirty page table > current record’s LSN — meaning the first operation that dirtied the page occurred after the current operation, so the current operation must have made it to disk before the crash


### Undo

Finally, we can do the undo phase to ensure atomicity. We start at the _end_ of the log and work our way back to the start. Intuitively, we want to undo any UPDATE for any running or aborting transaction at the time of crash. We will only undo UPDATEs that do not have corresponding CLRs (meaning, we will not undo UPDATEs that have already been undone by a CLR).

We have one extra piece of metadata to track in this phase: the _undoNextLSN_. This field stores the LSN of the operation that we want to next undo for that transaction (derived from the prevLSN of the operation currently being undone). Once we undo all operations for a transaction, we can write an END record for that transaction.

Here is the pseudocode for the undo phase (taken from the [Berkeley DB notes](https://cs186berkeley.net/resources/static/notes/n14-Recovery.pdf)):

```

toUndo = {lastLSN of all transactions in transaction table}

while !toUndo.isEmpty():

	currRecord = max(toUndo)

	if currRecord.type == CLR:

		if currRecord.undoNextLSN == NULL:

			# Write END record for currRecord.transaction_id

		else:

			toUndo.add(currRecord.undoNextLSN)

	else:

		if currRecord.type == UPDATE:

			# Undo update in the DB


        # Write CLR record for currRecord.transaction_id


        if currRecord.prevLSN != NULL:


        	toUndo.add(currRecord.prevLSN)


        if currRecord.prevLSN == NULL:


        	# Write END record for currRecord.transaction_id

	toUndo.remove(currRecord)

```

The intuition behind the pseudocode is as follows: we want to undo all the not-undone operations for all the transactions in the transaction table. So we keep iterating through operations of the transactions, in reverse order (according to LSNs). If the record was a CLR, then we don’t have anything to undo in the DB – we just traverse to the next LSN to undo (or write an END if there isn’t one). If the record was an UPDATE, we undo it  in the DB, log a CLR record, and traverse to the next LSN to undo (or write an END if there isn’t one).


### Optimization: Checkpointing

In production DBs, it can be terribly inefficient to reconstruct the transaction and dirty page tables from the absolute beginning of the log. So ARIES uses checkpointing to speed up the analysis phase, which periodically writes the contents of the transaction and dirty page tables to the log, so we can read from the latest checkpoint instead of reconstructing from scratch.

With checkpointing, <BEGIN\_CHECKPOINT> and <END\_CHECKPOINT> records get written to the log, with the contents of the transaction and dirty page tables in between. When reconstructing, we need to start reading operations from the <BEGIN\_CHECKPOINT> — because the tables saved to the log can be the state at any point between the <BEGIN\_CHECKPOINT> and <END\_CHECKPOINT> records.


### List of LSNs

The Berkeley DB course [notes](https://cs186berkeley.net/resources/static/notes/n14-Recovery.pdf) have a helpful appendix of all the LSNs:


<table>
  <tr>
   <td><strong>LSN name</strong>
   </td>
   <td><strong>Description</strong>
   </td>
  </tr>
  <tr>
   <td>LSN
   </td>
   <td>Log sequence number (increasing, unique)
   </td>
  </tr>
  <tr>
   <td>flushedLSN
   </td>
   <td>LSN that was last flushed to disk, stored in memory
   </td>
  </tr>
  <tr>
   <td>pageLSN
   </td>
   <td>LSN for the last operation that edited that page (every page has a pageLSN)
   </td>
  </tr>
  <tr>
   <td>prevLSN
   </td>
   <td>LSN for the last operation for the same transaction, stored in each log record
   </td>
  </tr>
  <tr>
   <td>lastLSN
   </td>
   <td>Last LSN corresponding to the transaction, stored in each entry in the transaction table
   </td>
  </tr>
  <tr>
   <td>recLSN
   </td>
   <td>First LSN to modify the page, stored in each entry of the dirty page table
   </td>
  </tr>
  <tr>
   <td>undoNextLSN
   </td>
   <td>The LSN of the next operation to undo for the same transaction, stored in CLR records in the log
   </td>
  </tr>
</table>


 
