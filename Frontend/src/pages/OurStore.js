import React from "react";
import BreadCrumb from "../components/BreadCrumb";
import Meta from "../components/Meta";
import Container from "../components/Container";
import StoreView from "../components/StoreView";

const OurStore = () => (
  <>
    <Meta title="Shop | Cart Corner" />
    <BreadCrumb title="Shop" />
    <Container class1="store-wrapper home-wrapper-2 py-4">
      <h1 className="page-title mb-3">All products</h1>
      <StoreView />
    </Container>
  </>
);

export default OurStore;
