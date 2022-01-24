---
title: "The Modern ML Monitoring Mess: The Problem Umbrella (4/4)"
date: "2022-01-24"
description: ''
tags: ['machine learning']
---

I’ve set up the stage in the last few pieces by discussing streaming ML evaluation, thinking about what to monitor (across state and component axes), and failure modes in existing software monitoring tools (e.g. Prometheus). In this final piece, I propose a broader research agenda for problems in ML monitoring,[^1] motivated by “real-world” post-deployment ML problems.


## Preliminaries

In this section, I introduce an example scenario that will illustrate challenges outlined in future sections. I describe an ML task, dataset, Service Level Indicator (SLI), and pipeline architecture.



* **Task:**  For a taxi ride, we want to predict the probability that a taxi rider will give a driver a tip greater than 10% of the fare. This is a binary classification problem. Predictions are float-valued between 0 and 1.
* **Dataset:** We use data between January 1, 2020 and May 31, 2020 collected from the [NYC Taxi Coalition](https://www1.nyc.gov/site/tlc/about/tlc-trip-record-data.page). This data is timestamped and tabular. 
* **SLI:** We measure accuracy, or the fraction of correctly-predicted examples when rounded to the nearest integer. In ML communities, the SLI is commonly referred to as the evaluation metric.
* **Pipeline architecture:** Only one model is trained in our example.[^2] Although they share some components, there are two pipelines – representing training and inference. Refer to the third piece in this series for a [diagram](https://www.shreya-shankar.com/rethinking-ml-monitoring-3/#ml-task-data-source-and-pipeline).

## Umbrella of Research Challenges

In this section, I depict research challenges in a tree diagram. Although algorithms for training ML models is an important research area, I omit it in this piece to focus on challenges centered around data management.


### Metric Computation


#### Coarse-grained Monitoring

When it comes to monitoring, the first question anyone should ask is: what’s the real-time value of the SLI? Or, what is the pipeline accuracy right now? Surprisingly, this is hard to do, especially at scale. Some reasons are:



* **Separation between prediction and feedback components:** if one pipeline makes predictions while another ingests feedback, we’d need to perform high-cardinality joins. This may not be a research problem per se, but an annoying engineering problem to think about, especially in the streaming setting.
* **Changing subpopulations of interest:** many organizations monitor SLIs for different subpopulations (e.g. customers) Over time, new subpopulations or demographics might gradually enter the data stream.
* **Label lag:** feedback arrives in the system after some time, and the delay is almost never uniform across different predictions or subgroups.


##### Scalable Monitoring Infrastructure

Tackling the first two problems, especially at scale, calls for better monitoring infrastructure that prioritizes incrementally maintained joins, flexible definitions of SLIs (i.e. user-defined functions), and the ability to add new SLI definitions post-deployment and compute them over historical windows of data. My last piece demonstrated how Prometheus doesn’t meet any of these needs. To this end, I’m thinking about an ML monitoring system with the following layers:

**Storage.** We’d need a time-series database for persistent storage (computed metric values, histograms or summaries, raw outputs, and feedback) and in-memory streams for fast joins and metric computation.

**Execution.** Users should be able to specify metric functions as Python UDFs, which we could run incrementally on windows of data with a differential dataflow-based system. Consider a hypothetical user workflow:


```
def compute_accuracy(curr_true, curr_pred):
	return float(sum(curr_true == curr_pred) / len(curr_true)))



t = Task(name="high_tip_prediction", description="Predicting high tip for a taxi driver")
t.registerMetric(name="accuracy", window=timedelta(hours=2), fn=compute_accuracy)

...
# Under the hood, we automatically compute metrics based on params defined above. User calls the following:
t.logOutputs(...)
t.logFeedback(...)
```


One issue is that users might have large amounts of data, introducing bottlenecks in the Python UDF computation. We could leverage approximate query processing (AQP) techniques to compute metrics with reasonable errors. For example, metric computation functions could run on histograms instead of full data streams; however, operating on adaptive histograms is challenging. Furthermore, users care about subpopulations of data, and these subpopulations change over time – motivating metric computation across dynamic groups and the ability to backfill subgroup metric values when new subgroups arise.

**Querying.** Supporting fast _and_ flexible queries is of utmost importance. As I mentioned in previous posts, users will want to query across state/time and component axes. Precomputing and storing summaries – including joins and metric values – before users query results in the lowest latency queries; however, users may want to vary window sizes and other parameters at query time. What is the best tradeoff between precomputing before query time and computing everything on the fly? And how do we think about this for dynamic subgroups?

A preliminary prototype[^3] to compute streaming ML SLIs, defined as Python UDFs, across different components, shows promising query latency and minimal logging overhead:


![Query Latency](./querylatencyall.png)
![Logging Latency](./loggingtimeall.png)
*Figure 1: ML query and logging latency.*



##### Label Lag

Lag introduces interesting algorithmic challenges to computing SLIs. Consider the following scenarios of how an ML system might receive feedback, and how we might think about approximate real-time SLIs:


###### Full-Feedback

This is the most straightforward case – we only need to perform a streaming join to compute an SLI over a window. Problems occur at scale, or when our window size is too large to fit predictions and feedback in-memory. One natural solution might be to perform approximate streaming joins, but instead of subsampling streams to join (and exponentially losing information), we can construct “exemplars” (i.e. “weighted” tuples) for subgroups of interest and join exemplars on subgroup labels. For example, in our high tip prediction problem, we can group our predictions and labels by neighborhood (e.g. FiDi, Tribeca, Midtown), pick exemplars in these groups, aggregate predictions and labels for these exemplars, and join them to compute metrics. Research challenges lie in devising efficient, high-accuracy methods to compute subgroups and exemplars.


###### No-Feedback

This scenario typically occurs immediately after deployment. For example, suppose we trained a fraud detection model for credit card transactions. Before we ask a team of analysts to hand-label transactions our model made predictions for, we wouldn’t know how well our classifier is performing in real-time! Still, can we estimate this?

One basic idea is to use importance weighting (IW) techniques. At a high level, we could identify subgroups in the data (“bucket” the data), figure out the training SLI (e.g. accuracy) for each bucket, and aggregate these SLI values for buckets in the live (post-deployment, unlabeled) data to come up with the estimated metric. For a more sophisticated (and higher-confidence) approach, we could construct different bucketings and average the resulting SLI estimates. Again, research challenges lie in identifying these subgroups or buckets. We can draw from the rich history of predicate-finding literature (i.e. finding attributes that influence a result, typically presented as a conjunction or disjunction of clauses) in the DBMS community.


###### Partial Feedback

This scenario is the most common amongst ML pipelines I’ve seen “in the wild.” Often, live data is only labeled on a schedule, and more often than not, some upstream data collection issues influence feedback coming in (e.g. there’s a cell tower outage in a region of Tribeca, causing payment meter data to arrive later than expected). Can we apply the full-feedback case to the labeled data points and the no-feedback case to the unlabeled data points – and simply aggregate these estimates?

At a first glance, maybe we can aggregate the full-feedback and no-feedback estimates, weighted by the count of data points in each bucket. But the reality is that lag is rarely uniformly distributed across buckets – unpredictable phenomena such as sensor failures, power outages, and new regulation cause the distribution of lag to be unknown and changing over time. Identifying groups of data points that have similar feedback lag times is critical to producing accurate estimates of real-time SLIs[^4]. Existing streaming pattern mining algorithms, such as frequent itemsets, look through features in windows of _known_ data points. Our problem is harder because the data points we want to apply the frequent itemsets algorithm to – the ones that don’t have feedback (i.e. the “laggy” points) – might get feedback after we compute the frequent itemsets. Concretely, how do we extend streaming frequent itemset algorithms to efficiently recompute itemsets after removing data points? We can build on work in incremental maintenance of frequent itemsets.


#### Fine-grained Monitoring

Once SLIs are going down, the highest priority is to get them back up as soon as possible. The “fine-grained” monitoring category deals with understanding whether models should be retrained or if engineering problems in the pipeline are root causes of failure. Furthermore, if models should be retrained (e.g. there is “drift” or “shift”), how should we change the training set to increase performance?


##### Detecting Data Quality Issues

Research in data management for ML observability has made strides in automatically identifying engineering issues in data pipelines. Techniques such as schema validation, detecting outliers within batches, and constraints on statistics (e.g. expected mean, completeness, and ranges) of features can flag unexpected data quality issues such as broken sensors and incomplete upstream data ingestion. Declaring bounds or expectations might be feasible with a handful of features and high familiarity with the problem domain, but can this scale to high-dimensional settings – for example, when data scientists are throwing 2000 or more features at an xgboost model? Furthermore, drawing the line between “engineering issue” and “drift” is hard, especially if we want to automate detecting issues. Tools like TFX allow users to monitor distance metrics of interest like KL divergence and the Kolmogorov-Smirnov test statistic, but these fail in cases where visually-inspected L<sub>1</sub> distance is low and distances from metrics of interest are high (thousands of data points, more than ten features). Strategies to mitigate this problem assume having the number of data points that a FAANG company might be working with (hundreds of millions, if not billions). If outside a FAANG company, what techniques can we use to bridge the gap between empirical drift $d(\hat{p}, \hat{q})$ and theoretical drift $d(p, q)$ between two distributions $p$ and $q$?


##### Towards Retraining Models

**A massive problem in both research and practitioner communities is that “distribution shift” is a poorly defined and overloaded phrase, causing confusion across the board.** When people say “distribution shift,” they refer to a phenomenon where one dataset comes from a different distribution than another dataset. “Distribution shift” could cause an ML performance degradation – for example, models trained on one taxi company provider’s data might perform poorly on data taken from another taxi company provider. This overloaded phrase encompasses different types of shift; for example:



* Concept shift: a change in the relationship between input features and target outputs (i.e. labels). An example of this is end-of-year Wall Street bonuses causing riders to tip more for a week.
* Covariate shift: a change in the distribution of input variables in the training data, not the target output distribution. An example of this is receiving more taxi rides in Midtown (Times Square for the ball drop) on New Year’s Eve. 
* Age shift: an expected increase or decrease in the distribution for an input variable over time. An example of this is a taxicab’s total mileage, which can only increase over time.

A lot of research and existing methods in “distribution shift” focus on comparing two finite sets of data. As I’ve mentioned earlier in this series, in practice, we care about deploying models over infinite streams of data, or data for the foreseeable future. Are we supposed to arbitrarily cut production data into two fixed-size datasets to wonder if there is a “distribution shift?” This doesn’t seem right. In the streaming ML setting, the question we really care about is: at what point does my model not work as expected for my current data (i.e. **when do I need to retrain my model?**).

In reality, decreases in SLIs result from combinations of different types of shift, especially in highly nonstationary environments. Thinking from a product perspective, how actionable is telling a user that “78% comes from concept shift and 22% from covariate shift,” even if we could precisely determine this breakdown? The actionable insight to give users is when and how to retrain models post-deployment, given the “abnormalities” occurring in the current window of data. Suppose we have labels or feedback $Y$ and input data or features $X$, where $X_i$ represents data for the $i$th feature across all data points. In order of increasing granularity, types of abnormalities could include:


* Shift in $P(Y | X)$ but no shift in $P(X)$
* No shift in $P(Y | X)$ but shift in $P(X)$
* Shift in $P(X_i)$
* Shift in $P(X_i | X_j)$ where $i \ne j$
* Shift in $P(X_i | X_j, X_k, \hdots)$ where $i \ne \j \ne k$

Unfortunately, identifying which of these cases occur in practice is extremely difficult, especially in the streaming setting when there isn’t a fixed break between distributions (as is the case in ML research settings). One interesting thought is to train a model to identify whether there are seasonal patterns in distances between observed $P(Y | X)$ and $P(X)$ in sliding windows. Tracking all combinations of features is impractical, so again – is it possible to leverage predicate-finding algorithms to simplify the space of distance metrics to track? Furthermore, to do this at scale, as we incrementally maintain adaptive histograms or summaries of windows of data, how do we compute distance metrics as correctly as possible?

Finally, based on the types of abnormalities detected, we can suggest ways to augment or change the training set. For example, in the case where $P(X)$ changes but $P(Y | X)$ is the same, we can suggest an upsample of underrepresented subpopulations. In the case where $P(Y | X)$ changes but $P(X)$ remains the same, maybe users can retrain their model on a recent window of data. Research challenges lie in specific, useful hints to construct new training datasets to avoid low performance pitfalls.


### Visualizations

Current ML monitoring dashboards are overloaded with information. Users see hundreds, or even thousands, of bar charts and graphs trying to visualize “distribution shift.” These charts are not actionable, especially when people can use the same group of charts (i.e. dashboard) to tell two conflicting stories. For instance, a user could argue that a model needs to be retrained because a feature’s mean value has plummeted in the last few days. On the other hand, a user could argue that this feature isn’t one of the three most important features, so retraining the model wouldn’t have a large impact. Thus, from an interface perspective, drawing the line on when to retrain a model given hundreds of graphs is an arbitrary process. How do we come up with better visualization tools?

**Dashboard goals.** The purpose of monitoring visualizations is to help users be in sync with their data and models. To this end, good monitoring dashboard should include the following:


* Unambiguously answer specific questions, e.g.
    * What is the real-time ML performance?
    * Is this performance higher or lower than expected? Than required (i.e. meeting SLOs)?
    * Is the reason for lower performance a data quality issue?
    * Should the model be retrained?
* A few plots at most, describing the “single metric to rule them all,” so users aren’t overwhelmed

**Dashboard challenges.** Visualizing metrics across more than two dimensions is very hard. Unfortunately, we have at least the following dimensions when it comes to ML metrics:


* Metric value
* Components (i.e. joins across components in pipelines, see the single-component vs cross-component discussion in the second essay in this series)
* State (i.e. historical window of outputs that we care about, size could vary)
* Subpopulation (including groups of features)
* Time (in the generic sense, e.g. plotting the rolling mean of 100-day windows across the last 6 months)

How do we develop visualizations that unambiguously communicate information across all these dimensions without too much cognitive overhead?

**Towards insightful visualizations.** Coupled with fine-grained monitoring information as described in the earlier section, a good dashboard will have insightful visualizations to give users intuition for how distributions are changing. Existing “state-of-the-art” visualizations that ML engineers use (determined via word-of-mouth, so take with a grain of salt[^5]) include static bar chart histograms comparing two datasets. This is hard to reason about in a streaming ML setting. What new types of visualizations can explain changes in fine-grained metrics? Here’s an example of a “dynamic” violin plot of high tip predictions that shows, intuitively, how the distribution of outputs changes over time:



![Output distribution](./output_violin.gif)
*Figure 2: Output distribution over time.*


In the example above, there is a confirmed decrease in the SLI (accuracy), as we have full feedback (i.e. all predictions have labels). In cases where we need to approximate the SLI and hypothetically reason about fine-grained metrics, maybe users could intuitively see seasonality in such a visualization. This is definitely not the end-all-be-all solution, but going back to the main point: research challenges lie in principled ways to come up with better visualizations for understanding data drift and automatically presenting these to users based on the data and ML tasks they work with.


### Datasets & Benchmarks

Many researchers and developers work mainly with toy data or synthetic distribution shifts due to lack of access to “real-world” streaming ML tasks. To this end, a few problems revolve around datasets and benchmarks to accelerate progress in ML monitoring:



1. **A repository of real-time streams of data that correspond to tractable ML tasks.** Properties of a good data stream include: it’s infinite, representative of a real-world phenomenon, and has an ML task that’s easier to solve than predicting the weather or stock prices. A particularly high-impact problem might be Ethereum gas price prediction. Specifically, can a model output the minimum gas price necessary for a transaction to go through in the next hour with 95% confidence? Another option is to convert existing benchmarks to a streaming format (e.g. samples point $x_t$ from train and test distributions ($D$ and $D’$) from WILDS with a function where $x_t \in D$ with high probability when timestamp $t$ is small and $x_t \in D’$ with high probability when $t$ is large).
2. **Interfaces for querying data from the repository in an intuitive way.** Most data scientists don’t work with streaming systems, so how do we allow them to perform range queries and receive Pandas or PyTorch datasets? How do we safeguard users against label leakage or accidentally peeking into the future when they experiment with new ideas?
3. **Interfaces **(dare we say, a DSL?)** for creating and evaluating _policies_ for training models, not single model binaries** as a Kaggle competition would. mltrace’s vision is to be a React-like library where users define components of pipelines with triggers that run before and after every component is run. In these triggers, users can decide to retrain models based on their own criteria – such as data drift metrics or scheduled updates.


## Conclusion

With enough context about an ML task, it’s probably possible to solve the data management problems specific to that task. But in building a general-purpose monitoring tool, there are several ad-hoc challenges that stem from increased ML pipeline and system complexity, including:



* **Growing data science teams and tool stacks.** Software engineering has shown that fragmentation in teams and tool stacks makes it hard to keep up system sustainability. This will hold for ML, especially when the number of possible ML data management tools largely increases every year. Debugging a model that someone else trained is a pain.
* **Model stacking.** Many organizations chain models together to produce final predictions. Drift detection is hard enough for one model. Tracing faulty predictions back to the specific model(s) that need to be debugged seems extra challenging.
* **Uninterpretable features.** Many organizations use ML to produce embeddings that are fed as features to downstream ML tasks.[^6] Data quality alerts, such as user-defined constraints on feature columns, then cannot be constructed. 


* **Deploying components as containerized applications.** It is hard to do online learning in Kubernetes clusters. Containerized infrastructure works well primarily for stateless applications, and unfortunately, online and continual learning is stateful (i.e. model weights are updated and need to be shared across prediction serving pods).

I haven’t thought too deeply about these ad-hoc challenges, but I suspect that a good ML monitoring tool will be aware of them at least. 

Finally, I want to end this series on a personal note.[^7] I am grateful to have the time to critically think about ML monitoring and the support of both industry professionals and academic collaborators. Thank you to:



* My advisor Aditya Parameswaran, who is currently kindly paying for me to be a full-time Thought Leader as I think about ML monitoring[^8] 


* My undergraduate mentees Aditi Mahajan and Boyuan Deng, who do a lot of engineering while their peers are probably training the latest and greatest ML models
* My collaborator Peter Schafhalter, a RISELab PhD student and Rust and differential dataflow expert
* Everyone doing ML in industry that I’ve talked to over the past year

One of my higher-level goals in this PhD is to find the balance between hacking together suboptimal solutions and thinking deeply about the “correct” answer to a problem, from “first principles.” I tend to pursue the latter, maybe a bit too much. I look forward to cultivating my personal sweet spot on the sliding scale between daydreaming about novel contributions and staying practical. 


<!-- Footnotes themselves at the bottom. -->
## Notes

[^1]:
     Usually, I talk about observability. Monitoring is a subproblem within observability, with the most interesting research questions (in my opinion).

[^2]:

     New challenges arise with model _stacking_, or chaining models together to create final predictions.

[^3]:
     Based on timely-dataflow (Rust-based differential dataflow implementation). Shoutout to Peter Schafhalter for the quick work on this.

[^4]:
     Not to mention, determining which subgroups have higher lag times can be helpful for debugging purposes.

[^5]:
     I am working on an interview study to formally write about “best practices” for post-deployment ML maintenance.

[^6]:

     The perils of deep learning fall into this category.

[^7]:
     Kudos to anyone who has made it through all 4 posts in this series. Seriously. I’m pretty sure I haven’t read all the words in here. 

[^8]:

     I promise this will change and I’ll start writing papers! :)
