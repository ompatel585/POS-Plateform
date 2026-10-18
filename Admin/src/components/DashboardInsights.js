import React, { useEffect, useMemo } from "react";
import { Table, Tag } from "antd";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import dayjs from "dayjs";
import { getProducts } from "../features/product/productSlice";
import { getCustomers } from "../features/customers/customerSlice";
import { lowStockRows } from "../utils/csv";

const money = (n) => `₹${Math.round(Number(n || 0)).toLocaleString("en-IN")}`;

const KpiCard = ({ label, value, hint, accent, to }) => {
  const body = (
    <div className="bg-white rounded-3 p-3 h-100 shadow-sm" style={{ borderTop: `3px solid ${accent}` }}>
      <p className="desc mb-1">{label}</p>
      <h4 className="mb-1 sub-title fw-semibold">{value}</h4>
      {hint && <small className="text-muted">{hint}</small>}
    </div>
  );
  return to ? (
    <Link to={to} className="text-decoration-none d-block h-100">
      {body}
    </Link>
  ) : (
    body
  );
};

// KPIs and lists built from orders/products/customers already loaded by the admin APIs
const DashboardInsights = () => {
  const dispatch = useDispatch();
  const orders = useSelector((state) => state?.auth?.orders?.orders);
  const products = useSelector((state) => state?.product?.products);
  const customers = useSelector((state) => state?.customer?.customers);

  useEffect(() => {
    dispatch(getProducts());
    dispatch(getCustomers());
  }, [dispatch]);

  const stats = useMemo(() => {
    const live = (orders || []).filter((o) => o.orderStatus !== "Cancelled");
    const today = live.filter((o) => dayjs(o.createdAt).isSame(dayjs(), "day"));
    const month = live.filter((o) => dayjs(o.createdAt).isSame(dayjs(), "month"));
    const pending = live.filter((o) => ["Ordered", "Processed"].includes(o.orderStatus));
    const newCustomers = (customers || []).filter(
      (c) => c.role !== "admin" && dayjs(c.createdAt).isSame(dayjs(), "month")
    );
    const sum = (list) => list.reduce((t, o) => t + Number(o.totalPriceAfterDiscount ?? o.totalPrice ?? 0), 0);
    return {
      todaySales: sum(today),
      todayOrders: today.length,
      monthSales: sum(month),
      pending: pending.length,
      newCustomers: newCustomers.length,
      cancelled: (orders || []).length - live.length,
    };
  }, [orders, customers]);

  const lowStock = useMemo(() => lowStockRows(products), [products]);

  const topProducts = useMemo(() => {
    const totals = new Map();
    (orders || [])
      .filter((o) => o.orderStatus !== "Cancelled")
      .forEach((o) =>
        o.orderItems?.forEach((item) => {
          const id = item.product?._id || item.product;
          if (!id) return;
          const row = totals.get(id) || {
            key: id,
            title: item.product?.title || "Deleted product",
            units: 0,
            revenue: 0,
          };
          row.units += item.quantity;
          row.revenue += item.quantity * item.price;
          totals.set(id, row);
        })
      );
    return [...totals.values()].sort((a, b) => b.units - a.units).slice(0, 5);
  }, [orders]);

  return (
    <>
      <div className="row g-3 mb-4">
        <div className="col-6 col-xl-2">
          <KpiCard label="Sales today" value={money(stats.todaySales)} hint={`${stats.todayOrders} orders`} accent="#47ad24" />
        </div>
        <div className="col-6 col-xl-2">
          <KpiCard label="This month" value={money(stats.monthSales)} hint={dayjs().format("MMMM")} accent="#1677ff" />
        </div>
        <div className="col-6 col-xl-2">
          <KpiCard label="To fulfil" value={stats.pending} hint="Ordered or processed" accent="#ffd333" to="/admin/orders" />
        </div>
        <div className="col-6 col-xl-2">
          <KpiCard label="Low stock" value={lowStock.length} hint="items need restock" accent="#e52e2e" to="/admin/low-stock" />
        </div>
        <div className="col-6 col-xl-2">
          <KpiCard label="New customers" value={stats.newCustomers} hint="this month" accent="#722ed1" to="/admin/customers" />
        </div>
        <div className="col-6 col-xl-2">
          <KpiCard label="Cancelled" value={stats.cancelled} hint="all time" accent="#828599" />
        </div>
      </div>

      <div className="row g-3 mb-4">
        <div className="col-12 col-lg-7">
          <div className="bg-white rounded-3 p-3 h-100 shadow-sm">
            <h5 className="mb-3">Top selling products</h5>
            <Table
              size="small"
              pagination={false}
              dataSource={topProducts}
              locale={{ emptyText: "No sales yet" }}
              columns={[
                { title: "Product", dataIndex: "title" },
                { title: "Units", dataIndex: "units", width: 80 },
                { title: "Revenue", dataIndex: "revenue", width: 120, render: money },
              ]}
            />
          </div>
        </div>
        <div className="col-12 col-lg-5">
          <div className="bg-white rounded-3 p-3 h-100 shadow-sm">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h5 className="mb-0">Running low</h5>
              <Link to="/admin/low-stock">See all</Link>
            </div>
            {lowStock.length === 0 ? (
              <p className="desc mb-0">Everything is well stocked.</p>
            ) : (
              lowStock.slice(0, 6).map((r) => (
                <div key={`${r.product._id}-${r.size}`} className="d-flex justify-content-between align-items-center py-2 border-bottom">
                  <Link to={`/admin/product/${r.product._id}`} className="text-truncate me-2 text-dark">
                    {r.product.title}
                    {r.size && <span className="text-muted"> · {r.size}</span>}
                  </Link>
                  <Tag color={r.quantity <= 0 ? "red" : "orange"}>{r.quantity <= 0 ? "Out" : `${r.quantity} left`}</Tag>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default DashboardInsights;
