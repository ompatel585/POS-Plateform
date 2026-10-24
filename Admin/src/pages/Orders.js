import React, { useEffect, useMemo, useState } from "react";
import { Table, Button, DatePicker, Input, Select, Tag, Space } from "antd";
import { DownloadOutlined } from "@ant-design/icons";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import dayjs from "dayjs";
import { getOrders, updateAOrder } from "../features/auth/authSlice";
import { openOrderBillWindow } from "../utils/orderBill";
import { downloadCsv } from "../utils/csv";

const STATUSES = ["Ordered", "Processed", "Shipped", "Out for Delivery", "Delivered", "Cancelled"];
const STATUS_COLORS = {
  Ordered: "gold",
  Processed: "blue",
  Shipped: "geekblue",
  "Out for Delivery": "purple",
  Delivered: "green",
  Cancelled: "red",
};

const customerName = (order) =>
  [order?.user?.firstname, order?.user?.lastname].filter(Boolean).join(" ").trim() ||
  order?.user?.name ||
  "Customer";

const paymentLabel = (order) =>
  order?.mode === "OFFLINE"
    ? "In store"
    : order?.paymentInfo?.method === "COD"
    ? "Cash on delivery"
    : "Online";

const Orders = () => {
  const dispatch = useDispatch();
  const orderState = useSelector((state) => state?.auth?.orders?.orders);

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState(null);
  const [mode, setMode] = useState(null);
  const [dateRange, setDateRange] = useState(null);

  useEffect(() => {
    dispatch(getOrders());
  }, [dispatch]);

  const updateOrderStatus = async (id, next) => {
    // Cancelling puts the items back in stock and can't be reversed from here
    if (next === "Cancelled" && !window.confirm("Cancel this order? Stock will be restored.")) return;
    await dispatch(updateAOrder({ id, status: next }));
    dispatch(getOrders());
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return [...(orderState || [])]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .filter((order) => {
        if (status && order.orderStatus !== status) return false;
        if (mode && (order.mode || "ONLINE") !== mode) return false;
        if (dateRange) {
          const d = dayjs(order.createdAt);
          if (d.isBefore(dateRange[0].startOf("day")) || d.isAfter(dateRange[1].endOf("day"))) return false;
        }
        if (q) {
          const haystack = [order._id, customerName(order), order.user?.email, order.user?.mobile]
            .join(" ")
            .toLowerCase();
          if (!haystack.includes(q)) return false;
        }
        return true;
      });
  }, [orderState, search, status, mode, dateRange]);

  const columns = [
    {
      title: "Order",
      dataIndex: "_id",
      render: (id) => <Link to={`/admin/order/${id}`}>#{id.slice(-8).toUpperCase()}</Link>,
    },
    { title: "Customer", render: (_, order) => customerName(order) },
    {
      title: "Amount",
      dataIndex: "totalPriceAfterDiscount",
      sorter: (a, b) => a.totalPriceAfterDiscount - b.totalPriceAfterDiscount,
      render: (amount, order) => (
        <span>
          ₹{Number(amount || 0).toLocaleString("en-IN")}
          {order.coupon?.name && <Tag className="ms-2">{order.coupon.name}</Tag>}
        </span>
      ),
    },
    {
      title: "Date",
      dataIndex: "createdAt",
      sorter: (a, b) => new Date(a.createdAt) - new Date(b.createdAt),
      render: (d) => new Date(d).toLocaleString("en-IN"),
    },
    {
      title: "Payment",
      render: (_, order) => (
        <Tag color={order.mode === "OFFLINE" ? "volcano" : order.paymentInfo?.method === "COD" ? "orange" : "green"}>
          {paymentLabel(order)}
        </Tag>
      ),
    },
    {
      title: "Status",
      dataIndex: "orderStatus",
      render: (s) => <Tag color={STATUS_COLORS[s] || "default"}>{s}</Tag>,
    },
    {
      title: "Bill",
      render: (_, order) => (
        <Space size={4}>
          <Link to={`/admin/order/${order._id}`}>View</Link>
          <Button type="link" size="small" style={{ padding: 0 }} onClick={() => openOrderBillWindow(order)}>
            Print
          </Button>
        </Space>
      ),
    },
    {
      title: "Update status",
      render: (_, order) => (
        <select
          value={order.orderStatus}
          disabled={order.orderStatus === "Cancelled"}
          onChange={(e) => updateOrderStatus(order._id, e.target.value)}
          className="form-control form-select form-select-sm"
          style={{ minWidth: 150 }}
        >
          {STATUSES.map((s) => (
            <option key={s} value={s} disabled={s === "Ordered"}>
              {s}
            </option>
          ))}
        </select>
      ),
    },
  ];

  const exportCsv = () =>
    downloadCsv(
      `orders-${dayjs().format("YYYY-MM-DD")}.csv`,
      filtered.map((o) => ({
        id: o._id,
        date: dayjs(o.createdAt).format("YYYY-MM-DD HH:mm"),
        customer: customerName(o),
        email: o.user?.email || "",
        mobile: o.user?.mobile || "",
        items: o.orderItems?.reduce((n, i) => n + i.quantity, 0) || 0,
        subtotal: o.totalPrice,
        coupon: o.coupon?.name || "",
        total: o.totalPriceAfterDiscount,
        payment: paymentLabel(o),
        status: o.orderStatus,
        city: o.shippingInfo?.city || "",
        state: o.shippingInfo?.state || "",
      })),
      [
        { key: "id", label: "Order ID" },
        { key: "date", label: "Date" },
        { key: "customer", label: "Customer" },
        { key: "email", label: "Email" },
        { key: "mobile", label: "Mobile" },
        { key: "items", label: "Items" },
        { key: "subtotal", label: "Subtotal" },
        { key: "coupon", label: "Coupon" },
        { key: "total", label: "Total" },
        { key: "payment", label: "Payment" },
        { key: "status", label: "Status" },
        { key: "city", label: "City" },
        { key: "state", label: "State" },
      ]
    );

  const hasFilters = search || status || mode || dateRange;

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3">
        <h3 className="title mb-0">Orders</h3>
        <Button icon={<DownloadOutlined />} onClick={exportCsv} disabled={!filtered.length}>
          Export CSV ({filtered.length})
        </Button>
      </div>

      <div className="d-flex flex-wrap gap-2 mb-3">
        <Input.Search
          allowClear
          placeholder="Search order ID, name, email or phone"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ width: 300 }}
        />
        <Select
          allowClear
          placeholder="Any status"
          value={status}
          onChange={setStatus}
          style={{ width: 170 }}
          options={STATUSES.map((s) => ({ value: s, label: s }))}
        />
        <Select
          allowClear
          placeholder="Online & in store"
          value={mode}
          onChange={setMode}
          style={{ width: 170 }}
          options={[
            { value: "ONLINE", label: "Online" },
            { value: "OFFLINE", label: "In store (POS)" },
          ]}
        />
        <DatePicker.RangePicker
          value={dateRange}
          onChange={setDateRange}
          popupClassName="single-calendar-range"
          allowClear
        />
        {hasFilters && (
          <Button
            type="link"
            onClick={() => {
              setSearch("");
              setStatus(null);
              setMode(null);
              setDateRange(null);
            }}
          >
            Clear filters
          </Button>
        )}
      </div>

      <Table rowKey="_id" columns={columns} dataSource={filtered} loading={!orderState} scroll={{ x: 900 }} />
    </div>
  );
};

export default Orders;
