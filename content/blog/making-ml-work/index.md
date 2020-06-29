---
title: "Reflections on one year: making machine learning actually useful"
date: "2020-06-29"
description: ''
tags: ['machine learning']
---

For those of you who don’t know my story, I’ll give you the short version: I did machine learning research for two years, decided not to get a PhD at the time, and became the first machine learning engineer at [Viaduct](https://www.viaduct.ai/), a startup that provides an end-to-end machine learning platform for automakers. Since we essentially sell machine learning as a service, we’re directly responsible for making machine learning actually work in the real world. 

Now that I’ve celebrated one year at the company, I want to reflect on how my machine learning mindset has changed over the past couple of years. In this essay, I discuss how working at Viaduct opened my eyes to the challenges of operationalizing machine learning, and how neither my classes nor research forced me to consider these challenges. Based on [crazy advances in the ML research community](https://hai.stanford.edu/research/ai-index-2019), an [explosion in computational power](https://timdettmers.com/2018/10/17/tpus-vs-gpus-for-transformers-bert/), and [accessible state-of-the-art ML education](https://course.fast.ai/), one would expect applying ML in industry to be a home run. But [87% of data science projects never make it to production](https://venturebeat.com/2019/07/19/why-do-87-of-data-science-projects-never-make-it-into-production/). In this essay, I explore why this gap exists. 


## Data is actually more important than models

When I joined the company, I first worked on [vehicle personalization tools](https://www.viaduct.ai/solutions#in-vehiclepersonalization). I engineered an R&D project to identify drivers’ home and workplace locations based only on de-identified vehicle sensor information (for drivers who elected to opt-in). Coming fresh out of research, I experimented with state-of-the-art methods: unsupervised deep learning algorithms for raw time series data. For weeks, I’d train the models, visualize the locations of a de-identified drive, and get frustrated that the predicted labels didn’t make sense. One day, I gave up on modeling and created a new feature to approximate each vehicle’s home: its most frequent location at 2 AM. I appended this to my training dataset, retrained my models, and suddenly the predicted labels made sense!

Based on others’ experiences (ex: the [Netflix Prize](https://www.netflixprize.com/community/topic_1537.html)) and even my own experiences over the past year, the greatest performance gains come from adding new features or redefining the train and validation splits. However, in research, it’s almost like the datasets are sacred and shouldn’t be touched. Once, for a deep learning class in my sophomore year of college, I had a project idea -- to upsample training instances in [SQuAD](https://rajpurkar.github.io/SQuAD-explorer/) that were similar to data points misclassified in the validation set. This idea got vetoed, since it wasn’t directly related to modeling and probably wouldn’t be substantial enough for the final project. 

In my opinion, ML research as a field puts too much emphasis on innovations in modeling, rather than rethinking the data paradigm. Even in 2020, papers come out that show how simpler models with [random data augmentations such as cropping outperform complex models without](https://arxiv.org/abs/2004.14990). What other data-related low hanging fruits are we missing? Why is just the modeling portion of machine learning conventionally sexy to work on? Any development that leads to dramatic performance gains should be considered impactful.


## Interpretability matters, for unanticipated reasons

There can be a tradeoff between interpretability and performance in ML models. Yann LeCun famously argues that [interpretability is less important than people think](https://qr.ae/pNKMF2). On the other hand, Been Kim argues that [we need interpretability to understand ML as a tool enough to safely and confidently use it](https://www.quantamagazine.org/been-kim-is-building-a-translator-for-artificial-intelligence-20190110/). I think both are correct, but how does this play out in applied machine learning?

Most production-ready machine learning models today are “just-get-me-there” models: models that meet minimal money-saving requirements. For example, if I’m at point A, just give me a policy that’s good enough to quickly get to point B. Or, maybe I want to reduce A/C costs, and I just want a policy of when to heat or cool the water loads. If these models perform “perfectly,” then arguably we don’t need interpretability. But for the models I build, I have on the order of a thousand features, and I’d be thrilled if I could come up with a high-performing “just-get-me-there” model on the first try even if the model’s decisions weren’t explainable. But the reality is that I usually don’t succeed on the first try.

When I first built a model to predict [which vehicles will have an engine failure in the next month](https://www.viaduct.ai/solutions#predictiveanalytics), I didn’t know how to improve its performance. Separately, I trained a shallow decision tree on the training data and predictions to determine which features and thresholds maximized information gain. Thanks to this simple interpretability tool, I realized that features for a specific population of vehicles were incorrectly computed. Upon further analysis, I found that I incorrectly used a “left join” instead of an “inner join” upstream in the feature generation stage. What a mess! Interpretability methods can help debug models and guide new approaches to feature engineering, data preprocessing, and modeling that deliver outsized impact.


## The need for reproducibility

When multiple people are working on machine learning, there are two big concepts that should matter in both research and industry:




1. *Reproducibility:* Given the code and data, can I get the same results as advertised in the paper or technical report?
2. *Replicability:* If I apply this algorithm on different data, will it still work? Will I get similar results? It’s very common in industry that there are different distributions in the training, validation, and test sets. 

A plethora of yearly ML conferences and a [rat race to publish](https://medium.com/@NeurIPSConf/what-we-learned-from-neurips-2019-data-111ab996462c#:~:text=NeurIPS%20has%20quadrupled%20in%20the,corresponding%20to%201428%20accepted%20papers.) lead to perverse incentives for ML researchers. There’s [some](https://medium.com/@NeurIPSConf/designing-the-reproducibility-program-for-neurips-2020-7fcccaa5c6ad) encouragement for reproducibility and replicability, [but it may not be enough](https://www.wired.com/story/artificial-intelligence-confronts-reproducibility-crisis/). On the occasion that ML researchers open-source their code, very few other people are running end-to-end training and evaluation with most open-sourced research code repositories. Often this open-sourced code only runs the model on one dataset with some random seed and would be messy to extend to another setting. 

In direct contrast, most industry ML projects absolutely require reproducibility and replicability. When a model has potential to save money, it’s indefinitely run in production, and all that matters is consistently getting high performance. Money-saving metrics aside, consistent high performance is also necessary to build enough trust with clients to invest in deploying the model’s predictions.

Once someone writes a training and evaluation pipeline in industry, it needs to be “productionized,” or integrated into the existing codebase and scheduled to run at some interval. For machine learning to be useful, reproducibility is of utmost performance before the code is productionized: if you can’t run your code a week later and get similar results when someone else builds on it, how will your machine learning pipeline deliver value? [Many researchers believe they've addressed reproducibility by publishing their code and results](https://www.cs.mcgill.ca/~jpineau/ReproducibilityChecklist.pdf), but in industry, reproducibility requires much more -- it includes the data collection, [ETL](https://en.wikipedia.org/wiki/Extract,_transform,_load), featurization, train/validation split, and more aspects that are already taken care of in many research projects (i.e. modeling on benchmark datasets).

Furthermore, replicability is challenging in industry, where you have streams of real-time data and have to design your training and validation datasets. First, you get the latest data in the stream; second, you clean that data; third, you separate the data into train and validation datasets; finally, you fit a model. At the end of these steps, the training and validation datasets might be several layers of indirection away from the stream! High validation dataset performance won’t necessarily imply good real-time performance, where real-time data could reflect a different distribution than the training and validation datasets.

Assuming the code is reproducible, if the model doesn’t replicate performance on new data in the stream, then the machine learning project won’t succeed. Solutions to this [continual learning problem](https://nips.cc/Conferences/2018/Schedule?showEvent=10910) aren’t completely clear. Should we use simpler models to prevent overfitting? Should we scrutinize the data more before applying ML methods? Most industry solutions involve constantly retraining models every few days or weekly on “recent” training data, which can be computationally intensive and isn’t obviously the best solution.


## Designing systems for machine learning

The end-to-end workflows of a researcher and an ML engineer are completely different, even though both require a careful understanding and practice of science and have an end goal of achieving a certain ML performance. As an ML engineer, 90% of my work involves modeling-agnostic tasks, such as creating the infrastructure around loading and cleaning custom data, running experiments, being able to reproduce these experiments, and integrating the machine learning-specific code into existing production codebases. Every company has built their own version of this tooling, so the answer isn’t “just use [TFX, TensorFlow’s end-to-end platform for deploying production ML pipelines](https://www.tensorflow.org/tfx)!”

I will probably write a separate essay about designing systems for machine learning, but here’s a sneak peek. When designing parts of the ML pipeline for engineers and data scientists at my company, I try to design around the following principles:



*   Most machine learning errors are silent errors. Design a system with rigorous testing and monitoring that makes it super easy for the programmer to do the right thing and super difficult for the programmer to make a mistake.
*   Reproducibility is super important. If I run the training and evaluation pipelines today and sometime next week, the results should be the same. 
*   Data scientists (usually PhDs and former researchers) are not software engineers. There are too many tools ([7, on average](https://databricks.com/blog/2018/12/06/cio-survey-top-3-challenges-adopting-ai-and-how-to-overcome-them.html)) in the ML stack. Data scientists don't love an abundance of tools, and complex tooling makes debugging more challenging.
*   Build systems for ease of model iteration, not a “one-off experiment.” Rarely does a data scientist or ML engineer run a “one-off experiment” to train a model and put it in production, especially in dynamic data environments like high-frequency trading.

Building systems for machine learning in industry or production is different than building systems for machine learning research, which seems to be more “solved” than the former. 


## What’s next for machine learning?

I’m noticing this trend in industry to [treat machine learning as software 2.0](https://medium.com/@karpathy/software-2-0-a64152b37c35). If you’re not familiar with this term, software 1.0 refers to a paradigm of thinking where programs are an explicit description of problem-solving steps. Andrej Karpathy argues that software 2.0 is a shift in this paradigm — software 2.0 “is code written by the optimization based on an evaluation criterion (such as “classify this training data correctly”).” We aren’t at software 2.0 yet, but is the [current paradigm of machine learning](https://developers.google.com/machine-learning/crash-course) really going to stand for the foreseeable future?

I think it’s worth considering the immediate gaps that need to be closed in order for ML to work in production outside of large companies. I believe, for starters, there needs to be a paradigm shift in the way we researchers, students, teachers, and practitioners view and develop machine learning. 



1. Machine learning conceptually shouldn’t just focus on modeling. “Data-ing” is equally important. After taking 13 machine learning classes at Stanford, I can tell you what good models look like (i.e. add dropout to prevent overfitting, follow a convolutional layer with a pooling layer), but I never learned to iterate on the data. Outside of ML classes and research, I learned that often the most reliable way to get performance improvements is to find another piece of data which gives insight into a completely new aspect of the problem, rather than to add a tweak to the loss. Whenever model performance is bad, we (scientists and practitioners) shouldn’t only resort to investigating model architecture and parameters. We should also be thinking about “culprits” of bad performance in the data.
2. Machine learning practitioners need to develop models that are actually representative of real-time data. By the time you maximize model performance, which could be several months after starting the project, and you introduce your model to production, how do you make sure the model is representative of real-time data? Before we even come up with models, the field of machine learning needs methods to understand dataset skew and have continual learning methods to address these issues.
3. We need experiment reproducibility and replicability. Everywhere. 

Usually when people ask me what I do, I comment on how I wear different hats. On some days I’m a researcher, devising new methods of working with large-scale imbalanced datasets. On other days I’m an engineer, building infrastructure to allow data scientists to replicate their experiments. I can’t say that machine learning is solely a subclass of science, nor can I say that machine learning is solely a subclass of software engineering. I don’t know whether researchers, scientists, or engineers will be responsible for the next great machine learning advances. A new crop of practitioners will emerge, those that shape the culture around how data scientists, engineers, and product people collaborate on applying machine learning such that it is actually useful.

*Thanks to [Alex Tamkin](https://twitter.com/AlexTamkin), [Bora Uyumazturk](http://web.stanford.edu/~yuyumaz/), [Sarah Catanzaro](https://twitter.com/sarahcat21), [Andy Chen](https://www.linkedin.com/in/asjchen/), [David Hallac](https://www.linkedin.com/in/david-hallac-593a5987/), [Peter Maldonado](https://twitter.com/petermaldonado_), and [Vincent Duong](https://www.linkedin.com/in/duongvv/) for their feedback on multiple drafts.*


