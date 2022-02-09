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
        {/* <Image src={require('../images/profile-pic.jpg')} alt="Shreya Shankar" /> */}
        <h3>Bio</h3>
        <p>
          I'm Shreya Shankar (she/her), a computer scientist living in San Francisco, California. Currently, I am doing my PhD in databases at UC Berkeley. Previously, I was the first ML engineer at <a href="https://www.viaduct.ai/" target="_blank">Viaduct</a>, did research at <a href="https://ai.google/research/teams/brain" target="_blank">Google Brain</a>, and software engineering at <a href="https://www.facebook.com" target="_blank">Facebook</a>.
        </p>
        <p>
          I graduated from Stanford University with a B.S. and an M.S. in computer science with concentrations in systems and artificial intelligence, respectively. At Stanford, I helped run a nonprofit called SHE++, an organization that helps to empower underrepresented minorities in technology. I also spent a lot of time as a section leader for <a href="https://cs198.stanford.edu/cs198/Alumni.aspx" target="_blank">CS198</a> and served as the head TA for <a href="https://cs106b.stanford.edu" target="_blank">CS106B</a>.
        </p>
        <h3>Contact</h3>
        <p>
          To reach me, you can email <a href="mailto:shreyashankar@berkeley.edu">shreyashankar@berkeley.edu</a>. I am also fairly active on <a href="https://twitter.com/sh_reya" target="_blank">Twitter</a>, <a href="https://github.com/shreyashankar" target="_blank">Github</a> (for a PhD student), and <a href="https://www.strava.com/athletes/30137754" target="_blank">Strava</a>.
        </p>
        <p>
          My CV is available for download <a href={`/shreyashankarcv.pdf`} target="_blank">here.</a>
        </p>
        <h3>Research</h3>
        <p>
          I'm interested in building systems to <a href="https://www.youtube.com/watch?v=7skGd2gWN6U" target="_blank"> operationalize machine learning (ML) workflows</a>. My research focus is on <a href="https://arxiv.org/abs/2108.13557" target="_blank">end-to-end observability for ML systems</a>. I'm working on the following projects:
        </p>
        <table>
          <tr align="center">
            <th>
              Data Systems
            </th>
            <th>
              Machine Learning
            </th>
            <th>
              HCI
            </th>
          </tr>
          <tr>
            <td>
              <ul class="ul1">
                <li class="li1"><span class="s2">Mitigating effects of feedback delays on real-time ML performance</span></li>
                <li class="li1"><span class="s1"><a href="https://www.shreya-shankar.com/rethinking-ml-monitoring-4/#scalable-monitoring-infrastructure"><span class="s3">Differential dataflow to compute streaming ML metrics quickly and efficiently at scale</span></a></span></li>
              </ul>
            </td>
            <td>
              <ul class="ul1">
                <li class="li1"><span class="s2">Creating streaming ML benchmarks</span></li>
                <li class="li1"><span class="s2">Building repository of tasks with <a href="https://twitter.com/TweetAtAKK/status/1486026387525804034?s=20"><span class="s3">&ldquo;temporally evolving tabular data&rdquo;</span></a> (e.g. Ethereum gas price prediction)</span></li>
              </ul>
            </td>
            <td>
              <ul class="ul1">
                <li class="li1"><span class="s2">Interview study on best practices in CI / CD for ML</span></li>
                <li class="li1"><span class="s2">Visualizing large-scale data drift</span></li>
              </ul>
            </td>
          </tr>
        </table>
        <p>
          <strong>If you are interested in working on any of these projects or collaborating, please contact me via email.</strong> I am open to undergrads who have taken a databases course and/or a graduate level machine learning course. If you go to UC Berkeley, please mention that in your email.
        </p>
      </Layout>
    )
  }
}
