---
title: "Introducing mltrace"
date: "2021-05-10"
description: ''
tags: ['personal']
---

After I left [Viaduct](https://www.viaduct.ai/), I spent some time thinking about bridging the gap between machine learning research and production. MLOps, or [the practice of unifying ML development and ML system operations](https://cloud.google.com/architecture/mlops-continuous-delivery-and-automation-pipelines-in-machine-learning), is a diverse field and can be roughly broken down into the following subcategories:


*   Streamlining the industry model and ML pipeline development experience
*   Making results of data science and ML workflows accessible to other stakeholders
*   Deploying components of ML pipelines to production
*   Maintaining ML pipelines in production

I’m mainly interested in solving problems around production ML pipelines. As an [entrepreneur-in-residence at Amplify Partners](https://amplifypartners.com/firm-news/welcome-shreya-shankar/), I’m currently building the open-source tooling that I wish I had around deploying and maintaining models in production.

**What I’m working on**

I’m excited to share a dev release of [`mltrace`](https://github.com/loglabs/mltrace), a coarse-grained lineage and tracing tool for ML pipelines. It’s designed for collaborative teams working on production ML pipelines, which are composed of many different components that run and update at different cadences. It makes it easy to trace a prediction or model’s output back to its most upstream, raw data file.

![mltrace demo](./mltrace.gif)

You’ll notice, in this release, that the tool doesn’t actually have anything ML-specific aspects to it. It’s intentionally designed for complex pipelines with many chained data transformations. ML pipelines are instances of complex data pipelines.

Logging and tracing is only a first step. The [roadmap](https://github.com/loglabs/mltrace#future-directions) includes more features, specific to ML:



*   Displaying whether components of pipelines are “stale” (ex: you need to rerun a component such as model training)
*   Prometheus integrations to monitor component output distributions
*   Causal analysis for ML bugs — if you flag several outputs as mispredicted, which component runs were common in producing these outputs? Which component is most likely to be the biggest culprit in an issue?
*   Support for finer-grained lineage (at the record level)

**Why is MLOps uniquely hard?**

Although I don’t like using buzz words, [“Software 2.0,”](https://karpathy.medium.com/software-2-0-a64152b37c35) or the act of writing code to write code, is fundamentally a paradigm shift in software development because of the following:



*   Model development, data exploration, and continual learning produce many more artifacts to log, version, and manage
*   Most ML pipeline bugs are silent failures, not compiler or runtime errors

**Where I’m coming from**

My academic interests revolve more heavily around deploying components of ML pipelines to production and keeping these pipelines in production. Even when companies deploy to production, they face significant challenges in staying there. In my experience, production ML performance can deviate significantly from offline benchmarks over time or experience a phenomenon known as performance drift. This isn’t just because of the ML model — most of my bugs were actually caused by some unanticipated data or ETL issue.

On a more personal note, while I was at Viaduct and working on my own ML projects, I was frustrated by a general lack of open-source tools around deploying and keeping ML pipelines in production. I tediously rolled my own terrible monitoring solution involving a daily executed Spark job that dumped metrics to a daily-partitioned table and a dashboard to depict a line graph of these metrics over time. Some problems with this solution include:


*   This “online” metric was computed in Spark, while the “offline” training and evaluation metrics were computed in Python.
*   If the `HivePartitionSensor` on model output tables timed out, metrics weren’t computed.
*   Monitoring dashboards could be vastly different for different tasks. It wasn’t scalable to build or onboard people onto.
*   For any day on the metric graph, it was nearly impossible to retroactively figure out what data and code was involved in producing that metric. If the monitoring solution alerted me that something was wrong, I had no idea where to look. It felt somewhat useless to have monitoring without tracing and lineage.

**For many domains, particularly those involving time-series data or user behavior, ML solutions are not viable until we have the infrastructure to easily continually train, deploy, and monitor ML pipelines for even a single prediction task.** ML pipelines need to reflect the most recent state of the world, and this is especially challenging when the state of the world changes frequently.

**Get started**

You can clone or fork the repository [here](https://github.com/loglabs/mltrace) and check out the docs [here](https://mltrace.readthedocs.io/en/latest/index.html). It’s all open source, so feel free to jump in and create or tackle an issue in the repo. 

If you have any ideas or comments, feel free to email me at [shreyashankar@berkeley.edu](mailto:shreyashankar@berkeley.edu). I’d love to chat with people experiencing similar problems.

Thank you!

-Shreya

*Thanks to [Bora Uyumazturk](https://bora-uyumazturk.github.io/), [Sarah Catanzaro](https://twitter.com/sarahcat21), and [Mike Dauber](https://twitter.com/dauber) for their feedback on multiple drafts. Also, a special thank you to Mike and the team at Amplify for believing in me.*