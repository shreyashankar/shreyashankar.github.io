import React from "react"

import Links from "../components/links"
import Layout from "../components/layout"
import SEO from "../components/seo"

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
          I'm a masters student at Stanford University studying computer science with a focus in artificial intelligence. I also did my undergrad at Stanford studying computer systems. I've worked at <a href="https://ai.google/research/teams/brain">Google Brain</a>, <a href="https://amplifypartners.com/">Amplify Partners</a>, and <a href="https://www.facebook.com">Facebook</a>.
        </p> 
        <p>
          I'm interested in machine learning security and AI-inspired art. I care about building a future where AI augments human abilities and isn't easily broken. I'm also passionate about diversity in the tech industry, as I helped run a nonprofit called <a href="http://www.sheplusplus.com/">SHE++</a>, an organization that helps to empower underrepresented minorities in technology.
        </p>
        <p>
          To contact me, please email <a href="mailto:shreya@cs.stanford.edu">shreya@cs.stanford.edu</a>. Also, follow me on <a href="https://twitter.com/sh_reya">Twitter.</a> 
        </p>
      </Layout>
    )
  }
}