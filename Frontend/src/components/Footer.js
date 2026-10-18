import React from "react";
import { Link } from "react-router-dom";
import { BsLinkedin, BsGithub, BsYoutube, BsInstagram, BsTelephone, BsEnvelope, BsGeoAlt } from "react-icons/bs";

const Footer = () => {
  return (
    <footer className="site-footer">
      <div className="container-xxl py-5">
        <div className="row gy-4">
          <div className="col-12 col-lg-4">
            <Link to="/" className="brand-logo mb-3">
              Cart<span>Corner</span>
            </Link>
            <p className="small mb-4" style={{ maxWidth: 320 }}>
              Everyday essentials, fashion and electronics, delivered across India.
            </p>
            <div className="social-row">
              <a href="https://www.linkedin.com" target="_blank" rel="noreferrer" aria-label="LinkedIn"><BsLinkedin /></a>
              <a href="https://www.instagram.com" target="_blank" rel="noreferrer" aria-label="Instagram"><BsInstagram /></a>
              <a href="https://github.com" target="_blank" rel="noreferrer" aria-label="GitHub"><BsGithub /></a>
              <a href="https://www.youtube.com" target="_blank" rel="noreferrer" aria-label="YouTube"><BsYoutube /></a>
            </div>
          </div>

          <div className="col-6 col-md-4 col-lg-2">
            <h5>Shop</h5>
            <div className="footer-links">
              <Link to="/product">All products</Link>
              <Link to="/wishlist">Wishlist</Link>
              <Link to="/cart">Cart</Link>
              <Link to="/my-orders">Track orders</Link>
            </div>
          </div>

          <div className="col-6 col-md-4 col-lg-2">
            <h5>Information</h5>
            <div className="footer-links">
              <Link to="/privacy-policy">Privacy Policy</Link>
              <Link to="/refund-policy">Refund Policy</Link>
              <Link to="/shipping-policy">Shipping Policy</Link>
              <Link to="/term-conditions">Terms &amp; Conditions</Link>
            </div>
          </div>

          <div className="col-12 col-md-4 col-lg-4">
            <h5>Contact us</h5>
            <div className="footer-links">
              <span className="d-flex gap-2"><BsGeoAlt className="flex-shrink-0 mt-1" /> DAIICT College, Reliance Cross Rd, Gandhinagar, Gujarat 382007</span>
              <a href="tel:+918264954234" className="d-flex gap-2 align-items-center"><BsTelephone /> +91 82649 54234</a>
              <a href="mailto:devjariwala8444@gmail.com" className="d-flex gap-2 align-items-center"><BsEnvelope /> devjariwala8444@gmail.com</a>
              <Link to="/about">About us</Link>
              <Link to="/blogs">Blogs</Link>
              <Link to="/contact">Contact</Link>
            </div>
          </div>
        </div>
      </div>
      <div className="footer-bottom py-3">
        <div className="container-xxl d-flex flex-wrap justify-content-between gap-2">
          <span>&copy; {new Date().getFullYear()} Cart Corner. All rights reserved.</span>
          <span>Secure payments by Razorpay · Cash on delivery available</span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
