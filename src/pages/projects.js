import React from "react"

import Links from "../components/links"
import Layout from "../components/layout"
import SEO from "../components/seo"
import { Link } from "gatsby"
import { rhythm } from "../utils/typography"
import kebabCase from "lodash/kebabCase"
// import Image from "gatsby-image"

// import { rhythm } from "../utils/typography"

export default class Projects extends React.Component {
    render() {

        let projects = [
            {
                title: 'Toy ML Pipeline',
                description: 'This is a toy example of a standalone ML pipeline written entirely in Python. No external tools are incorporated into the master branch. I built it mainly to experiment with my ideas for ML tooling.',
                link: 'https://github.com/shreyashankar/toy-ml-pipeline'
            },
            {
                title: 'Create ML App',
                description: 'This project makes it easier to spin up a machine learning project locally in Python and handle various package dependencies using a Makefile. It abstracts away pip installs and virtual environment commands from the user.',
                link: 'https://github.com/shreyashankar/create-ml-app'
            },
            {
                title: 'GPT-3 Sandbox',
                description: 'This project enables users to create cool web demos using OpenAI\'s GPT-3 API with just a few lines of Python. Co-authored with Bora Uyumazturk.',
                link: 'https://www.github.com/shreyashankar/gpt3-sandbox'
            },
        ]

        return (
            <Layout location={this.props.location} title="Shreya Shankar">
                <SEO
                    title="Code"
                    keywords={[`code`]}
                />
                <Links />
                {projects.map((node) => {
                    console.log(node)
                    const title = node.title
                    const description = node.description
                    const link = node.link
                    return (
                        <div key={'project_' + title} >
                            <h3
                                style={{
                                    marginBottom: rhythm(0.5),
                                    marginTop: rhythm(1.5),
                                }}
                            >
                                <a href={link} target="_blank" rel="noopener noreferrer">
                                    {title}
                                </a>
                            </h3>

                            <p>{description}</p>
                        </div>
                    )
                })}
            </Layout>
        )
    }
}