import React, { useEffect, useMemo, useState } from "react";
import { Table, Button, Popover, DatePicker, Radio } from "antd";
import { FilterOutlined } from "@ant-design/icons";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import dayjs from "dayjs";
import { getOrders, updateAOrder } from "../features/auth/authSlice";

const columns = [
  { title: "SNo", dataIndex: "key" },
  { title: "Name", dataIndex: "name" },
  { title: "Product", dataIndex: "product" },
  { title: "Amount", dataIndex: "amount" },
  { title: "Date", dataIndex: "date" },
  {
    title: "Mode",
    dataIndex: "mode",
    render: (mode) => (
      <span
        style={{
          padding: "2px 6px",
          borderRadius: 4,
          fontSize: 11,
          color: "#fff",
          background: mode === "OFFLINE" ? "#fa541c" : "#52c41a",
        }}
      >
        {mode}
      </span>
    ),
  },
  { title: "Action", dataIndex: "action" },
];

const Orders = () => {
  const dispatch = useDispatch();
  const orderState = useSelector((state) => state?.auth?.orders?.orders);

  const [activeFilter, setActiveFilter] = useState(null); // "date" | "mode"
  const [filters, setFilters] = useState({
    dateRange: null,
    mode: null,
  });

  useEffect(() => {
    dispatch(getOrders());
  }, [dispatch]);

  const updateOrderStatus = (id, status) => {
    dispatch(updateAOrder({ id, status }));
  };

  const dataSource = useMemo(() => {
    if (!orderState) return [];

    return orderState.map((order, index) => ({
      key: index + 1,
      name: order?.user?.firstname,
      product: <Link to={`/admin/order/${order?._id}`}>View Orders</Link>,
      amount: order?.totalPrice,
      date: new Date(order?.createdAt).toLocaleString(),
      rawDate: order?.createdAt,
      mode: order?.mode || "ONLINE",
      action: (
        <select
          defaultValue={order?.orderStatus}
          onChange={(e) =>
            updateOrderStatus(order?._id, e.target.value)
          }
          className="form-control form-select"
        >
          <option value="Ordered" disabled>Ordered</option>
          <option value="Processed">Processed</option>
          <option value="Shipped">Shipped</option>
          <option value="Out for Delivery">Out for Delivery</option>
          <option value="Delivered">Delivered</option>
        </select>
      ),
    }));
  }, [orderState]);

  const filteredData = useMemo(() => {
    return dataSource.filter((item) => {
      let ok = true;

      if (filters.mode) {
        ok = ok && item.mode === filters.mode;
      }

      if (filters.dateRange) {
        const [start, end] = filters.dateRange;
        const d = dayjs(item.rawDate);
        ok =
          ok &&
          d.isAfter(start.startOf("day")) &&
          d.isBefore(end.endOf("day"));
      }

      return ok;
    });
  }, [filters, dataSource]);

  const filterContent = (
    <div style={{ width: 240 }}>
      <Radio.Group
        size="small"
        value={activeFilter}
        onChange={(e) => setActiveFilter(e.target.value)}
        style={{ marginBottom: 12 }}
      >
        <Radio.Button value="date">Date</Radio.Button>
        <Radio.Button value="mode">Mode</Radio.Button>
      </Radio.Group>

      {activeFilter === "date" && (
        <>
          <div style={{ fontSize: 12, marginBottom: 6 }}>
            Date Range
          </div>
          {/* <DatePicker.RangePicker
            size="small"
            style={{ width: "100%" }}
            popupStyle={{ fontSize: 12 }}
            onChange={(dates) =>
              setFilters((prev) => ({
                ...prev,
                dateRange: dates,
              }))
            }
          /> */}
          <DatePicker.RangePicker
  size="small"
  className="w-full"
  popupClassName="single-calendar-range" // 👈 THIS IS THE KEY
  onChange={(dates) =>
    setFilters((prev) => ({
      ...prev,
      dateRange: dates,
    }))
  }
/>

        </>
      )}

      {activeFilter === "mode" && (
        <>
          <div style={{ fontSize: 12, marginBottom: 6 }}>
            Order Mode
          </div>
          <Radio.Group
            size="small"
            value={filters.mode}
            onChange={(e) =>
              setFilters((prev) => ({
                ...prev,
                mode: e.target.value,
              }))
            }
          >
            <Radio value="ONLINE">Online</Radio>
            <Radio value="OFFLINE">Offline (POS)</Radio>
          </Radio.Group>
        </>
      )}

      <div
        style={{
          marginTop: 14,
          display: "flex",
          justifyContent: "flex-end",
          gap: 8,
        }}
      >
        <Button
          size="small"
          onClick={() => {
            setFilters({ dateRange: null, mode: null });
            setActiveFilter(null);
          }}
        >
          Clear
        </Button>
        <Button size="small" type="primary">
          Apply
        </Button>
      </div>
    </div>
  );

  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 16,
        }}
      >
        <h3 className="title">Orders</h3>

        <Popover
          content={filterContent}
          trigger="click"
          placement="bottomRight"
        >
          <Button size="small" icon={<FilterOutlined />}>
            Filters
          </Button>
        </Popover>
      </div>

      <Table columns={columns} dataSource={filteredData} />
    </div>
  );
};

export default Orders;
