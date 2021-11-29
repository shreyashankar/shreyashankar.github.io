---
title: "Under the hood: multiprocessing for machine learning practitioners"
date: "2020-04-30"
description: ''
tags: ['systems']
---

I've now met a number of data scientists, machine learning researchers, and machine learning practitioners that have heard of multiprocessing but don't quite know how it works under the hood. It's mind-boggling to me that several computer science or data science curricula don't teach anything about multiprocessing, other than it could possibly speed up your program.

At Stanford, I've TA'ed a systems course that covered multiprocessing and multithreading in C / C++. It's also suprising to me that many students who take that course go on to study AI / ML and don't leverage multiprocessing hacks to speed up their code.

This post is my attempt to motivate why multiprocessing could be useful for a machine learning practitioner and explain basic concepts behind a Python library you might use.

## Motivating multiprocessing
Suppose I’m trying to train a deep learning model on a large corpus of text for my NLP class. I inevitably wait close to half an hour for my program to preprocess the data because I don’t know how to use list comprehension optimally. Then, I train my deep learning model, which takes hours or maybe even days. Finally, I can evaluate my model, realize I screwed up, have no time to improve my model before the deadline, and hastily create my poster.

What if my program, or single *process* in this case, is CPU-bound (limited by the speed of the CPU)? In the example above, maybe the program is limited by some preprocessing transformations. Enter *multiprocessing*: a tool one can use to parallelize workflows in their programs.

I will not cover the differences between multiprocessing and multithreading in this post, but typically one uses multiprocessing when the program:
1. Is CPU-bound (limited by the speed of the CPU)
2. Does not use 100% of the processing unit, or the programmer has access to multiple processing units 

I was quite surprised when I realized many ML practitioners blindly use multiprocessing without understanding how it works. But it makes sense, because even at a school like Stanford, the ten AI courses I took did not mention multiprocessing.

In this post, I will describe how multiprocessing works at the operating system level and introduce an example where multiprocessing significantly speeds up a deep learning workflow. Before diving into the details, I will introduce the following concepts:
* A *context switch* refers to storing the state of process A right before the processor changes to process B. We need to store this state so the processor knows what to do when it returns to computation in process A.
* User programs request services from the operating system via *system calls*.  These services can be shared across multiple programs or processes. As a ML practitioner, you probably include system calls in your code regularly! For instance, if a process wants to read a file (shared resource), it makes the `read` system call. 

## Multiprocessing mechanics

As the programmer, you are responsible for determining where in your code you want to create another process to parallelize computation and figuring out how to *synchronize* the processes. Suppose we want to parallelize the preprocessing section of our workflow. For this example, let’s say we have 5 long input text files that we want to preprocess — which involves reading in the file, converting words to vectors, and zero-pad the inputs.

### C mechanics

First, let’s understand how multiprocessing might work in C on a Unix-based OS. To create a new process, we use the `fork()` system call, which tells the OS to create an exact replica of the original process — cloning the original process’s virtual address space, registers, executables, you name it. Think of this as “process mitosis.” The clone process is referred to as the “child” process, while the original process is referred to as the “parent” process. Right after the `fork()` system call returns, you have two identical processes with identical states. The only practical difference is that the processes have different IDs. Every process has an ID, which we can retrieve by using the `getpid()` system call.

You can think of it this way: `fork()` gets called once, but returns twice. The child process executes all code after the call to `fork()`.

```c
int main(int argc, char *argv[]) {
    printf(“Hello from process %d!\n", getpid());
    fork();
    printf(“Goodbye from process %d!\n", getpid());
    return 0;
}
```

This example could print the following:

```
Hello from process 1234!
Goodbye from process 1235!
Goodbye from process 1234!
```

This example could also print the following:

```
Hello from process 1234!
Goodbye from process 1234!
Goodbye from process 1235!
```

Whoa, why are there multiple ways the code could execute? The OS determines how to schedule the processes, or when to perform context switch. It can almost feel random (take an OS course to learn more!), so we have to write extra code to synchronize the processes if we care that the processes execute in a certain order.

If we’re going to perform synchronization, we need to be able to figure out which process is running the code. In the parent process, the call to `fork()` returns the ID of the child process. In the child process, the call to `fork()` returns 0. Let’s look at an example to understand what each process is doing:

```c
int main(int argc, char *argv[]) {
	printf(“Hello from process %d!\n", getpid());
	pid_t pid = fork();
	if (pid == 0) {
		printf(“Hello from the child process %d!\n”, getpid());
	} else {
		printf(“Hello from the parent process %d!\n”, getpid());
	}
	return 0;
}
```

What gets printed out?

```
Hello from the child process 1234!
Hello from the parent process 1235!
```

As an exercise, you can figure out the other order in which the statements can be printed out.

Now, we have the concepts necessary to perform some basic synchronization between the process. Suppose I want the child process to most definitely execute before the parent process. I can use the `waitpid()` system call to block the parent process until the child process has finished executing:

```c
int main(int argc, char *argv[]) {
	printf(“Hello from process %d!\n", getpid());
	pid_t pid = fork();
	if (pid == 0) {
		printf(“Hello from the child process %d!\n”, getpid());
		return 0; // Child process has finished
	} 

	// We’re in the parent process here, waiting for the child to finish

	int status;
	waitpid(pid, &status, NULL); 
        // status now contains information about how the
        // child process finished (maybe success, maybe failure)

	// Once waitpid returns, we know the child process has finished
	printf(“Hello from the parent process %d!\n”, getpid());
	return 0;
}
```

In this program, the call to `waitpid()` blocks the parent process from printing out its final greeting until the child process has finished. So the only output this program could produce is:

```
Hello from process 1234!
Hello from the child process 1235!
Hello from the parent process 1234!
```

You can read the man pages for `waitpid()` to learn more about its arguments and mechanics.

Finally, how can we tell a child process to run a program from scratch? It’s not very useful to have a child process only be able to perform basic system calls such as `read()` or `write()` or print statements. Fortunately, there is a system call named `execvp()` that accepts a path to an executable and an array of arguments you want to send to that executable (kind of like how you’d run a program at the command line). If `execvp()` succeeds, we never return back to the process’s code. Here’s an example:

```c
int main(int argc, char *argv[]) {
	printf(“Hello from process %d!\n", getpid());
	pid_t pid = fork();
	if (pid == 0) {
		char *arguments[] = {"/usr/bin/python", “hello-world.py”};
		execvp(arguments[0], arguments);
		// If any of the following lines execute, there was an error
		printf("Failed to invoke /usr/bin/python to execute the supplied arguments.”);
		exit(-1);
	} 

	// We’re in the parent process here, waiting for the child to finish

	int status;
	waitpid(pid, &status, NULL); 
        // status now contains information about how the
        // child process finished (maybe success, maybe failure)

	// Once waitpid returns, we know the child process has finished
	printf(“Child process finished. Goodbye from the parent process %d!\n”, getpid());
	return 0;
}
```

Assuming `hello-world.py` just prints “Hello world!”, the program above produces the following output:

```
Hello from process 1234!
Hello world!
Child process finished. Goodbye from the parent process 1234!
```

To recap this section, we’ve learned the following system calls to address the following concepts necessary for proper multiprocessing:
* `fork()` “clones” a process so we could potentially distribute work amongst multiple processes
* `waitpid()` enables synchronization between processes by blocking a parent process until its child completes
* `execvp()` allows a process to execute arbitrary programs, not just snippets of C code

### Multiprocessing in Python

Most practitioners implement ML-related code in Python, so how do we perform multiprocessing in Python? The `multiprocessing` Python library abstracts away the C system calls for us.

The core element of the `multiprocessing` module is the `Process` object. Here’s a simple example that spawns a process to print “Hello world!”

```python
from multiprocessing import Process
import os

def hello_world():
    print(f’Hello from process {os.getpid()}!’);

if __name__ == '__main__':
    print(f’Hello from process {os.getpid()}!’);
    p = Process(target=hello_world)
    p.start()
    p.join()
    print(f‘Child process finished. Goodbye from the parent process {os.getpid()}!’);
```

The above program produces the following output:

```
Hello from process 1234!
Hello from process 1235!
Child process finished. Goodbye from the parent process 1234!
```

To map the concepts from this Python library to low-level C system calls, you can imagine `p = Process(target=hello_world)` calls `fork()`, `p.start()` calls `execvp()`, and `p.join()` maps to `waitpid()`. The Python `multiprocessing` library looks very similar to a multithreading API, but we will not go into that in this blog post. I imagine the APIs are similar to make it easier for the programmer to use the library without knowing the intricacies of multiprocessing.

There are some other useful functionalities in the `multiprocessing` library, such as being able to create a “pool” of processes. For instance, if you have multiple cores, you can naively create a process for each core, and send a list of tasks to the pool:

```python
from multiprocessing import Pool

num_cores = 4

def preprocess(shard):
	# Do some preprocessing
	preprocessed_shard = …
	return preprocessed_shard

if __name__ == '__main__':
	# Load all shards
	shards = [pd.read_csv(…) for …]
	pool = Pool(num_cores)

	# Start the processes in parallel
	result = pool.map(preprocess, shards)

``` 

Okay, now how can we incorporate these concepts into an actual preprocessing and training application?

## Application

To be continued.