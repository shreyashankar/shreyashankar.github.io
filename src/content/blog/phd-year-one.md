---
title: "Thoughts on ML Engineering After a Year of my PhD"
pubDate: "July 18, 2022"
description: ""
---

Automating the end-to-end machine learning (ML) lifecycle, even for a specific prediction task, is neither easy nor obvious. People keep talking about how ML engineering (MLE) is a subset of software engineering or should be treated as such. But over the last 15 months of graduate school, I’ve been thinking about MLE through the lens of data engineering.

There are two types of business-critical MLEs. The first is the Task MLE, who is responsible for sustaining a specific ML pipeline (or small set of ML pipelines) in production. They are concerned with specific models for business-critical tasks. They are the ones paged when top-line metrics are falling, tasked with “fixing” something. They are the ones who can most likely tell you when a model was last retrained, how it was evaluated, etc.

Task MLEs have way too much on their plate. Data scientists prototype models and come up with feature ideas, which Task MLEs need to “productionize.” This entails writing pipelines to transform data into model inputs, train and retrain models, evaluate them, and dump predictions somewhere. Then Task MLEs need to oversee deployment, which often entails a staged rollout. Then Task MLEs need to do “monitoring” and quickly diagnose and react to ML-related bugs.

I was once a Task MLE. I did all of this, very poorly. When I left for the PhD, I spent around a month creating detailed notes on how the end-to-end ML lifecycle for my Task worked. While writing the documentation, I often wondered why I made certain choices&mdash;like why, on a model retrain, did the training set automatically refresh but the evaluation set stayed the same until someone manually refreshed it? I never set out to be scientifically unrigorous, yet I frequently came across my own experiment code with training assumptions that didn’t hold at evaluation time during model development, let alone post-deployment.

Sometimes, I was so scientifically sound that the business lost money. I automated a hyperparameter tuning procedure that split training and validation sets into many folds based on time and picked hyperparameters that averaged best performance across all the sets. I only realized how silly this was in hindsight. I should have taken the hyperparameters that yielded the best model for the latest evaluation set.

I have done enough research on production ML now to know that it pays to simply overfit to the most recent data and constantly retrain. Successful companies do this.

It puzzles me when people say that small companies can’t retrain every day because they don’t have FAANG-style budgets. It costs a few dollars, at best, to retrain many xgboost or scikit-learn models. Most models are not large language models. I learned this circuitously, while doing research in ML monitoring. I asked many small-company Task MLEs if and how they monitor their pipelines for distribution shifts, and most of them alluded to scheduled hourly, daily, or weekly retrains.

“I know it’s not really addressing the data drift problem,” a Task MLE once sheepishly told me, as if they were confessing a secret they would not dare write about in their performance reviews.

“Did the model performance go back up?” I asked.

“Well, yeah…” he said, trailing off.

“Then it’s addressing data drift,” I stated matter-of-factly, with the inflated confidence of a researcher.

Anecdotes like this really get me in a tizzy. I think it’s because what I thought were important and interesting problems are now, sadly, only interesting. Researchers think distribution shift is very important, but model performance problems that stem from natural distribution shift suddenly vanish with retraining.

I had a hard time finding the gold nugget in data drift, the practical problem. Now it seems obvious: data and engineering issues&mdash;instances of sudden drifts&mdash;trigger model performance drops. Maybe yesterday’s job to generate content-related features failed, so we were stuck with old content-related features. Maybe a source of data was corrupted, so a bunch of features became null-valued. Maybe this, maybe that, but the end result is the same: data looks different, models underperform, and business metrics are impacted.

Now feels like a good time to introduce the second MLE: the Platform MLE, who is responsible for helping Task MLEs automate tedious parts of their jobs. Platform MLEs build pipelines (including models) that support multiple Tasks, while Task MLEs solve specific Tasks. It’s analogous to, in the SWE world, building infrastructure versus building software on top of the infrastructure. But I call them Platform MLEs instead of Platform SWEs because I think it’s impossible to automate ML babysitting without a decent understanding of ML.

The need for a Platform MLE materializes when an organization has more than one ML pipeline. Some examples of the Platform and Task MLE distinction include:

- Platform MLEs are responsible for the pipelines to create features; Task MLEs are responsible for the pipelines to use features
- Platform MLEs are responsible for a framework to train models; Task MLEs are responsible for writing the config file for model architecture and retraining cadence
- Platform MLEs are responsible for triggering ML performance drop alerts; Task MLEs act on the alerts

Platform MLEs do not exist only at companies that aspire to reach a FAANG scale. They typically exist at any company that has more than one ML task. This is why, I think, MLOps is currently speculated to be extremely lucrative. Every ML company needs features, monitoring, observability, and more. But it is easier for Platform MLEs to build most of these services themselves&mdash;to write a pipeline that refreshes a table of features every day, to standardize logging across all ML tools, to save and version snapshots of datasets. The irony is that MLOps startups seek to replace Platform MLEs with paywalled services, yet they require Platform MLEs to integrate such services into their companies.

As an aside, some MLOps companies try to sell to Task MLEs, but Task MLEs are too busy babysitting models to go through a sales cycle. Babysitting is a tough job that requires a lot of focus and attention. I hope this changes in the future.

The Platform MLE duties I am most fascinated by, at this moment, are monitoring and debugging of sudden data drifts. Platform MLEs have limitations&mdash; they don’t get to change anything around the model, its inputs, or outputs&mdash; but they’re responsible for identifying when and how any of them are broken. The state-of-the-art solution is to monitor changes in coverages (i.e., fraction missing) and distributions of individual features (i.e., inputs) and model outputs over time. This is called _data validation._ When these changes exceed a certain threshold (e.g., 25% drop in coverage), Platform MLEs trigger an alert.

Data validation achieves great recall. I’ll bet that at least 95% of sudden drifts, largely induced by engineering issues, get captured by data validation alerts. But it achieves miserable precision (I’ll bet under 20% for most tasks), and it requires a Task MLE to enumerate thresholds for all features and outputs. In practice, the precision is probably even lower because Task MLEs have alert fatigue and silence most alerts.

_Can we trade off recall for precision?_ Not really, high recall is the whole point of a monitoring system. To catch bugs.

_Do you have to monitor every feature and output?_ No, but alerts need to be on a column level, otherwise they will not be actionable for the Task MLE. Saying that PCA component #4 drifted by 0.1 is useless.

_Can you ignore these alerts by triggering a retrain?_ No, there is no value in retraining on invalid data.

For a while, I believed that data validation was a proxy for ML metric (e.g., accuracy, precision, recall) monitoring. ML metric monitoring is nearly impossible to do in real-time due to a lack of ground-truth labels. Many organizations only get labels on a weekly or monthly basis, both of which are too slow. Additionally, not all the data is labeled. The only thing left to monitor was model inputs and outputs, I thought, so that’s why everyone does it.

I could not have been more wrong. Suppose Task MLEs have the ability to monitor real-time ML metrics. There are a couple of reasons why data validation is still useful. For one, models for different tasks can read from the same features. If a Platform MLE can correctly trigger a broken feature alert, multiple Task MLEs can benefit.

Second, in the era of modern data stack, model features and outputs (i.e., feature store) are frequently used by data analysts and thus require some guarantees. I once hastily executed a bunch of queries in Snowflake without realizing half of an age-related column had negative values and shamelessly presented these insights to a CEO.

I learned that it was okay to make such mistakes. Big data can help you tell any story you want, right or wrong. It’s only important that you unwaveringly stand by your incorrect insights; otherwise people will doubt your competence. It is not like anyone else will review your Pandas dataframe gymnastics in Untitled1.ipynb. They won’t _know_ that you’ve messed up.

I wish the last paragraph were a lie. I am only half-joking.

The need for guarantees on ML data and model quality (i.e., Service-Level Objectives or SLOs) brings me to the crux of my first year of research: the role of an MLE, whether a Task or Platform one, is to make sure such SLOs are met. This is reminiscent of data engineering to me, much more so than any other role. Simply put, data engineers are responsible for surfacing data to other employees; ML engineers are responsible for making sure this data and its dependent applications (e.g., ML models) aren’t garbage.

I think a lot about what it means to have good model quality. I hate the word quality. It’s such a vaguely-defined term, but the reality is that every organization has a different definition. Many people think quality means “not stale,” or ensuring that feature generation pipelines simply run successfully every time. This is a good start, but we should probably do better.

Through the data SLO lens, data validation is a successful concept because it clearly defines quality for every model input and output in a binary manner. Either the feature is at least half-missing, or it isn’t. Either the age is positive, or it isn’t. Either the record matches a predefined schema, or it doesn’t. Either SLOs are met, or they aren’t.

Suppose every organization is able to clearly define their data and model quality SLOs. In the ML setting, where should we validate the data? Traditionally, data-centric rules have been enforced by the DBMS. In the Postgres paper, Stonebraker succinctly articulates the need for databases to enforce rules: rules are hard to enforce in the application layer because the application usually would need access to more data than required for a transaction. For example, the paper mentions a database of employees with a rule that Joe and Fred need to have the same salary; it is better to enforce this in the data manager than have an application query both Joe and Fred’s salaries and assert equality every time it needs either Joe’s or Fred’s salaries.

A year ago, my advisor told me the phrase “constraints and triggers for ML pipeline health,” and it stuck even though I didn’t fully understand the implications. As an ex-Task MLE, I believed it meant instrumenting ML pipeline components with code to log means, medians, and various aggregations of inputs and outputs and throw errors when data validation checks failed&mdash;all things I did in my job.

Now that I have more experience as a Platform MLE, I don’t think Task MLEs should have to do any of that. Platform MLEs own the data managers, and task MLEs own the applications, or the downstream parts of ML pipelines. Platform MLEs should be enforcing rules (e.g., data validation) in feature tables so that Task MLEs are alerted while querying if there are any bugs. Platform MLEs should be executing triggers, like the various ad-hoc postprocessing Task MLEs do to predictions before surfacing them to their clients.

I also think a lot about how to make it easy for people to specify and understand “model quality.” Organizationally-specific definitions of model quality help explain why ML companies have their own production ML frameworks (e.g., TFX)&mdash;some open-source, some closed. Many new frameworks are coming up, as part of MLOps startups.

I used to think the reason why people won’t switch to a new framework is because it’s cumbersome to rewrite all pipeline code. This is partially true, but the webdev ecosystem is a counterexample: people will rewrite code if they get benefits. The only difference is that current ML pipeline frameworks are rarely standalone and cannot be easily plugged into various data management backends.

ML pipeline frameworks need to be tightly coupled with a DBMS that understands ML workloads&mdash;something that knows what types of triggers Task MLEs want, understands data validation and tunes alerts to have good precision and recall, and is fairly extensible. Maybe this is why many people I’ve recently talked to seem to be switching to Vertex AI&mdash;a service that acts as the database can do anything.

Doing research on all of this feels weird. It doesn’t feel like many of my friends’ PhDs, where I’m supposed to ask a series of scientific questions and run a bunch of experiments to come to a conclusion. My PhD feels more like an exploration, where I study how data management works, become a historian of the craft, and try to come up with views on how it will play out in the MLE ecosystem. It feels grounded theory-esque, where I’m constantly reupdating my views based on new information I learn.

It’s honestly uncomfortable to feel like I am changing my mind frequently; I’m not sure exactly how to describe it. Someone I’m very close to tells me that this is the nature of research&mdash;we don’t know all the answers, let alone questions, at the outset, but we develop a process to discover them. For my sanity’s sake, however, I look forward to when I’ll be changing my mind less about production ML.

_Thanks to [Preetum](https://twitter.com/PreetumNakkiran) for reading this and encouraging me to post it on my blog._
