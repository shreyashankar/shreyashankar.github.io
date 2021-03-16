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
        <Links />
        <div style={{ marginBottom: '40px' }}></div>
        <p>
          I'm Shreya Shankar, a computer scientist living in the Bay Area. I'm interested in making machine learning work in the real world.
        </p>

        <p>
          Currently, I work at <a href="https://www.viaduct.ai/" target="_blank">Viaduct</a>. Previously, I did research at <a href="https://ai.google/research/teams/brain" target="_blank">Google Brain</a>, learned about investing with <a href="https://amplifypartners.com/" target="_blank">Amplify Partners</a>, and software engineering at <a href="https://www.facebook.com" target="_blank">Facebook</a>.
        </p>
        <p>
          I graduated from Stanford University with a B.S. and M.S. in computer science. I concentrated in systems and artificial intelligence respectively. At Stanford, I helped run a nonprofit called <a href="http://www.sheplusplus.com/" target="_blank">SHE++</a>, an organization that helps to empower underrepresented minorities in technology. I also spent a lot of time as a section leader and teaching assistant for <a href="https://cs198.stanford.edu/cs198/" target="_blank">CS198</a>.
        </p>
        <p>
          To reach me, you can email <a href="mailto:shreya@cs.stanford.edu" target="_blank">shreya@cs.stanford.edu</a>. I am also fairly active on <a href="https://twitter.com/sh_reya" target="_blank">Twitter</a> and <a href="https://github.com/shreyashankar" target="_blank">Github.</a>
        </p>
      </Layout>
    )
  }
}