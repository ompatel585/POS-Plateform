import React, { useEffect, useMemo, useState } from "react";
import { Table, Tag, InputNumber, Button, Empty } from "antd";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { BiEdit } from "react-icons/bi";
import { getProducts } from "../features/product/productSlice";
import { downloadCsv, lowStockRows, LOW_STOCK_LIMIT } from "../utils/csv";

const THRESHOLD_KEY = "lowStockLimit";

const readThreshold = () => {
  const saved = Number(localStorage.getItem(THRESHOLD_KEY));
  return Number.isFinite(saved) && saved > 0 ? saved : LOW_STOCK_LIMIT;
};

const LowStock = () => {
  const dispatch = useDispatch();
  const products = useSelector((state) => state?.product?.products);
  const [limit, setLimit] = useState(readThreshold);

  useEffect(() => {
    dispatch(getProducts());
  }, [dispatch]);

  const rows = useMemo(
    () =>
      lowStockRows(products, limit).map((r, i) => ({
        key: `${r.product._id}-${r.size || "all"}`,
        sno: i + 1,
        title: r.product.title,
        brand: r.product.brand,
        category: r.product.category,
        size: r.size || "—",
        quantity: r.quantity,
        online: r.product.inventory?.online,
        id: r.product._id,
      })),
    [products, limit]
  );

  const changeLimit = (value) => {
    const next = Math.max(1, Number(value) || LOW_STOCK_LIMIT);
    setLimit(next);
    localStorage.setItem(THRESHOLD_KEY, String(next));
  };

  const columns = [
    { title: "#", dataIndex: "sno", width: 60 },
    { title: "Product", dataIndex: "title" },
    { title: "Brand", dataIndex: "brand" },
    { title: "Category", dataIndex: "category" },
    { title: "Size", dataIndex: "size", width: 80 },
    {
      title: "In stock",
      dataIndex: "quantity",
      width: 110,
      sorter: (a, b) => a.quantity - b.quantity,
      render: (q) => <Tag color={q <= 0 ? "red" : "orange"}>{q <= 0 ? "Out of stock" : `${q} left`}</Tag>,
    },
    {
      title: "Store",
      dataIndex: "online",
      width: 100,
      render: (online) => (online ? <Tag color="green">Online</Tag> : <Tag>Offline only</Tag>),
    },
    {
      title: "Restock",
      dataIndex: "id",
      width: 90,
      render: (id) => (
        <Link to={`/admin/product/${id}`} className="fs-4 text-success" aria-label="Edit product">
          <BiEdit />
        </Link>
      ),
    },
  ];

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center flex-wrap gap-3 mb-4">
        <div>
          <h3 className="title mb-1">Low stock</h3>
          <p className="desc mb-0">Products and sizes at or below your alert level.</p>
        </div>
        <div className="d-flex align-items-center gap-2">
          <span className="desc">Alert at</span>
          <InputNumber min={1} value={limit} onChange={changeLimit} style={{ width: 80 }} />
          <span className="desc">units</span>
          <Button
            disabled={!rows.length}
            onClick={() =>
              downloadCsv("low-stock.csv", rows, [
                { key: "title", label: "Product" },
                { key: "brand", label: "Brand" },
                { key: "category", label: "Category" },
                { key: "size", label: "Size" },
                { key: "quantity", label: "In stock" },
              ])
            }
          >
            Export CSV
          </Button>
        </div>
      </div>
      {rows.length === 0 && products ? (
        <Empty description="Everything is well stocked" />
      ) : (
        <Table columns={columns} dataSource={rows} loading={!products} pagination={{ pageSize: 20 }} />
      )}
    </div>
  );
};

export default LowStock;
