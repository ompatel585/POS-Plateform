import React from "react";
import { useParams } from "react-router-dom";
import BreadCrumb from "../components/BreadCrumb";
import Meta from "../components/Meta";
import Container from "../components/Container";
import StoreView from "../components/StoreView";

const Category = () => {
  const { name } = useParams();
  const category = decodeURIComponent(name || "");
  return (
    <>
      <Meta title={`${category} | Cart Corner`} />
      <BreadCrumb title={category} />
      <Container class1="home-wrapper-2 py-4">
        <h1 className="page-title mb-3 text-capitalize">{category}</h1>
        {/* key resets filters when moving between categories */}
        <StoreView key={category} fixedCategory={category} />
      </Container>
    </>
  );
};

export default Category;
