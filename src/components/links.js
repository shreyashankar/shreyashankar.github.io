import React from "react"
import { Link } from "gatsby"

export default class Links extends React.Component {
  render() {
    let containerStyle = {
      textAlign: 'center'
    };

    return (
      <div style={containerStyle}>
        <Link
            style={{
              boxShadow: `none`,
              textDecoration: `none`,
              color: `inherit`,
              margin: '0 20px'
            }}
            to={`/`}
          >
            HOME
        </Link>
        <Link
            style={{
              boxShadow: `none`,
              textDecoration: `none`,
              color: `inherit`,
              margin: '0 20px'
            }}
            to={`/about`}
          >
            ABOUT
          </Link>
      </div>
    );
  }
}