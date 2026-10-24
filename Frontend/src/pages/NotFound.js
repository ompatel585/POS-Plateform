import React from "react";
import { Link } from "react-router-dom";
import Meta from "../components/Meta";
import Container from "../components/Container";

const NotFound = () => (
  <>
    <Meta title="Page not found | Cart Corner" />
    <Container class1="home-wrapper-2">
      <div className="not-found">
        <div className="code">404</div>
        <h1 className="page-title mt-3">We couldn't find that page</h1>
        <p className="text-muted mb-4">The link may be broken, or the page may have moved.</p>
        <div className="d-flex gap-2 justify-content-center flex-wrap">
          <Link to="/" className="button">Back to home</Link>
          <Link to="/product" className="button button-outline">Browse products</Link>
        </div>
      </div>
    </Container>
  </>
);

export default NotFound;
