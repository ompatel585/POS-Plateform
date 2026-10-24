import React from "react";
import { useSearchParams } from "react-router-dom";
import BreadCrumb from "../components/BreadCrumb";
import Meta from "../components/Meta";
import Container from "../components/Container";
import StoreView from "../components/StoreView";

const Search = () => {
  const [searchParams] = useSearchParams();
  const q = (searchParams.get("q") || "").trim();
  return (
    <>
      <Meta title={q ? `“${q}” | Cart Corner` : "Search | Cart Corner"} />
      <BreadCrumb title="Search" />
      <Container class1="home-wrapper-2 py-4">
        <h1 className="page-title mb-3">
          {q ? <>Results for “{q}”</> : "Search"}
        </h1>
        <StoreView key={q} searchQuery={q} />
      </Container>
    </>
  );
};

export default Search;
