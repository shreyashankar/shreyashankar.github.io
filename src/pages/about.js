import React from "react"

import Links from "../components/links"
import Layout from "../components/layout"
import SEO from "../components/seo"
// import Image from "gatsby-image"

// import { rhythm } from "../utils/typography"

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
          I'm Shreya Shankar, a computer scientist living in the Bay Area. I'm interested in making machine learning work in the real world.
        </p>

        <p>
          Currently, I am exploring <a href="https://en.wikipedia.org/wiki/MLOps">"MLOps"</a> tooling ideas before starting a PhD. Previously, I was the first ML engineer at <a href="https://www.viaduct.ai/">Viaduct</a>, did research at <a href="https://ai.google/research/teams/brain">Google Brain</a>, learned about investing with <a href="https://amplifypartners.com/">Amplify Partners</a>, and software engineering at <a href="https://www.facebook.com">Facebook</a>.
        </p>
        <p>
          I graduated from Stanford University with a B.S. and an M.S. in computer science with concentrations in systems and artificial intelligence, respectively. At Stanford, I helped run a nonprofit called <a href="http://www.sheplusplus.com/">SHE++</a>, an organization that helps to empower underrepresented minorities in technology. I also spent a lot of time as a section leader and teaching assistant for <a href="https://cs198.stanford.edu/cs198/">CS198</a>.
        </p>
        <p>
          To reach me, you can email <a href="mailto:shreya@cs.stanford.edu">shreya@cs.stanford.edu</a>. I am also fairly active on <a href="https://twitter.com/sh_reya">Twitter.</a>
        </p>
      </Layout>
    )
  }
}
