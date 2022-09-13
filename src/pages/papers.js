import React from "react"

import Links from "../components/links"
import Layout from "../components/layout"
import SEO from "../components/seo"
import { Link } from "gatsby"
import { rhythm } from "../utils/typography"
import kebabCase from "lodash/kebabCase"
// import Image from "gatsby-image"

// import { rhythm } from "../utils/typography"

export default class Papers extends React.Component {
    authorFormat = (authors) => {
        if (authors.length === 1) return authors[0];
        return (authors.slice(0, -1).join(', ') + " and " + authors.slice(-1));
    };

    render() {

        let papers = [
            {
                title: 'Towards Observability for Machine Learning Pipelines',
                venue: 'To appear at VLDB 2023',
                authors: ['Aditya G. Parameswaran'],
                link: 'https://arxiv.org/abs/2108.13557'
            },
            {
                title: 'Bolt-on, Compact, and Rapid Program Slicing for Notebooks',
                venue: 'To appear at VLDB 2023',
                authors: ['Stephen Macke', 'Sarah Chasins', 'Andrew Head', 'Aditya G. Parameswaran'],
                link: 'https://smacke.net/papers/nbslicer.pdf'
            },
            {
                title: 'Rethinking Streaming Machine Learning Evaluation',
                venue: 'ICLR 2022: Workshop on ML Evaluation Standards',
                authors: ['Bernease Herman', 'Aditya G. Parameswaran'],
                link: 'https://arxiv.org/abs/2205.11473'
            },
            {
                title: 'Enabling certification of verification-agnostic networks via memory-efficient semidefinite programming',
                venue: 'NeurIPS 2020',
                authors: ['Sumanth Dathathri', 'Krishnamurthy Dvijotham', 'Alexey Kurakin', 'Aditi Raghunathan', 'Jonathan Uesato', 'Rudy R Bunel', 'Jacob Steinhardt', 'Ian Goodfellow', 'Percy S Liang', 'Pushmeet Kohli'],
                link: 'https://proceedings.neurips.cc/paper/2020/file/397d6b4c83c91021fe928a8c4220386b-Paper.pdf'
            },
            {
                title: 'Adversarial examples that fool both computer vision and time-limited humans',
                venue: 'NIPS 2018',
                authors: ['Gamalelden F. Elsayed', 'Brian Cheung', 'Nicolas Papernot', 'Alexey Kurakin', 'Ian Goodfellow', 'Jascha Sohl-Dickstein'],
                link: 'https://proceedings.neurips.cc/paper/2018/file/8562ae5e286544710b2e7ebe9858833b-Paper.pdf'
            },
            {
                title: 'No classification without representation: Assessing geodiversity issues in open data sets for the developing world',
                venue: 'NIPS 2017: Workshop on Machine Learning for the Developing World',
                authors: ['Yoni Halpern', 'Eric Breck', 'James Atwood', 'Jimbo Wilson', 'D. Sculley'],
                link: 'https://arxiv.org/abs/1711.08536'
            },
        ]


        return (
            <Layout location={this.props.location} title="Shreya Shankar">
                <SEO
                    title="Papers"
                    keywords={[`papers`]}
                />
                <Links />
                <div style={{ marginBottom: '40px' }}></div>
                {papers.map((node) => {
                    return (
                        <div key={'paper_' + node.title} >
                            {/* <h3
                                style={{
                                    marginBottom: rhythm(0.5),
                                    marginTop: rhythm(1.5),
                                }}
                            >
                                <a href={link} target="_blank" rel="noopener noreferrer">
                                    {title}
                                </a>
                            </h3> */}

                            <b style={{
                                marginBottom: rhythm(0.5),
                                marginTop: rhythm(1.5),
                            }}><a href={node.link} target="_blank" rel="noopener noreferrer">{node.title}</a></b>
                            <p>with {this.authorFormat(node.authors)}.<br />{node.venue}.</p>
                        </div>
                    )
                })}
            </Layout>
        )
    }
}