import React from "react"

import Links from "../components/links"
import Layout from "../components/layout"
import SEO from "../components/seo"
import Image from "gatsby-image"

import { rhythm } from "../utils/typography"

export default class About extends React.Component {
  render() {
    return (
      <Layout location={this.props.location} title="Shreya Shankar">
        <SEO
          title="About"
          keywords={[`about`]}
        />
        <Links/>
        <div style={{marginBottom: '40px'}}></div>
        <p>
          I'm the first machine learning engineer at <a href="https://www.viaduct.ai/">Viaduct</a> and concurrently pursuing a masters degree in computer science (machine learning) at Stanford. I also did my undergrad at Stanford studying computer systems. I've worked at <a href="https://ai.google/research/teams/brain">Google Brain</a>, <a href="https://amplifypartners.com/">Amplify Partners</a>, and <a href="https://www.facebook.com">Facebook</a>.
        </p> 
        <p>
          I'm interested in building scalable machine learning systems and algorithms that work in the real world. I care about building a future where AI augments human abilities and isn't easily broken. I'm also passionate about diversity in the tech industry, as I helped run a nonprofit called <a href="http://www.sheplusplus.com/">SHE++</a>, an organization that helps to empower underrepresented minorities in technology.
        </p>
        <p>
          To contact me, please email <a href="mailto:shreya@cs.stanford.edu">shreya@cs.stanford.edu</a>. You can also follow me on <a href="https://twitter.com/sh_reya">Twitter.</a> 
        </p>
      </Layout>
    )
  }
}