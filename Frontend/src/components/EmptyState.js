import React from "react";
import { Link } from "react-router-dom";
import { BsBoxSeam } from "react-icons/bs";

const EmptyState = ({ icon, title, message, actionLabel, actionTo, onAction }) => (
  <div className="empty-state">
    <div className="empty-icon">{icon || <BsBoxSeam />}</div>
    <h4>{title}</h4>
    {message && <p>{message}</p>}
    {actionLabel && actionTo && (
      <Link to={actionTo} className="button">
        {actionLabel}
      </Link>
    )}
    {actionLabel && onAction && !actionTo && (
      <button type="button" className="button" onClick={onAction}>
        {actionLabel}
      </button>
    )}
  </div>
);

export default EmptyState;
