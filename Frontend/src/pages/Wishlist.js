import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { BsHeart } from "react-icons/bs";
import BreadCrumb from "../components/BreadCrumb";
import Meta from "../components/Meta";
import Container from "../components/Container";
import ProductGrid from "../components/ProductCard";
import EmptyState from "../components/EmptyState";
import { getuserProductWishlist } from "../features/user/userSlice";

const Wishlist = () => {
  const dispatch = useDispatch();
  const wishlist = useSelector((state) => state?.auth?.wishlist?.wishlist);
  const wishlistIds = useSelector((state) => state?.auth?.wishlistIds) || [];

  useEffect(() => {
    dispatch(getuserProductWishlist());
  }, [dispatch]);

  // Hearts toggle instantly; filtering by ids keeps the page in sync without a refetch
  const items = (wishlist || []).filter((p) => wishlistIds.includes(p?._id));

  return (
    <>
      <Meta title="Wishlist | Cart Corner" />
      <BreadCrumb title="Wishlist" />
      <Container class1="wishlist-wrapper home-wrapper-2 py-4">
        <div className="section-head">
          <div>
            <h1 className="page-title">My wishlist</h1>
            <p>{items.length} saved {items.length === 1 ? "item" : "items"}</p>
          </div>
        </div>
        {wishlist === undefined ? (
          <ProductGrid loading skeletons={4} />
        ) : items.length === 0 ? (
          <EmptyState
            icon={<BsHeart />}
            title="Your wishlist is empty"
            message="Tap the heart on any product to save it here for later."
            actionLabel="Discover products"
            actionTo="/product"
          />
        ) : (
          <ProductGrid products={items} />
        )}
      </Container>
    </>
  );
};

export default Wishlist;
