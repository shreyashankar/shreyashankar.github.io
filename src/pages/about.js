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
          During my undergrad, I was involved in <a href="https://cs4good.com/">CS+Social Good</a>, a student organization that focuses on the intersection of technology and social impact. I also helped run a nonprofit called <a href="http://www.sheplusplus.com/">SHE++</a>, an organization that helps to empower underrepresented minorities in technology. I have also been on the organizing team for <a href="https://www.treehacks.com/">TreeHacks</a>, Stanford's largest international hackathon. 
        </p>
        <p>
          I'm pretty opinionated about many things involving computers, consumer products, research, and diversity. I try to blog regularly, but I definitely tweet regularly. <a href="https://twitter.com/sh_reya">Follow me on Twitter.</a> 
        </p>
        <p>
          To contact me, please email <a href="mailto:shreya@cs.stanford.edu">shreya@cs.stanford.edu</a>. 
        </p>
      </Layout>
    )
  }
}