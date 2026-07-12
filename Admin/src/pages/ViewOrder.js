import React, { useEffect, useMemo } from "react";
import { Button, Table } from "antd";
import { useDispatch, useSelector } from "react-redux";
import { useParams } from "react-router-dom";
import { getaOrder } from "../features/auth/authSlice";
import { openOrderBillWindow } from "../utils/orderBill";

const columns = [
  {
    title: "SNo",
    dataIndex: "key",
  },
  {
    title: "Product Name",
    dataIndex: "name",
  },
  {
    title: "Brand",
    dataIndex: "brand",
  },
  {
    title: "Color",
    dataIndex: "color",
  },
  {
    title: "Qty",
    dataIndex: "count",
  },
  {
    title: "Amount",
    dataIndex: "amount",
  },
];

const ViewOrder = () => {
  const { id: orderId } = useParams();
  const dispatch = useDispatch();

  useEffect(() => {
    if (orderId) {
      dispatch(getaOrder(orderId));
    }
  }, [dispatch, orderId]);

  const orderState = useSelector((state) => state?.auth?.singleorder?.orders);

  const dataSource = useMemo(() => {
    const items = orderState?.orderItems || [];

    return items.map((item, index) => ({
      key: index + 1,
      name:
        item?.product?.title ||
        item?.product?.name ||
        item?.product?.productName ||
        "Product",
      brand: item?.product?.brand || "-",
      count: item?.quantity || 0,
      amount: item?.price || 0,
      color: (
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <span
            style={{
              width: 14,
              height: 14,
              borderRadius: "50%",
              display: "inline-block",
              backgroundColor: item?.color?.title || item?.color?.name || "#d1d5db",
              border: "1px solid #d1d5db",
            }}
          />
          <span>{item?.color?.title || item?.color?.name || "-"}</span>
        </span>
      ),
    }));
  }, [orderState]);

  const customerName = useMemo(() => {
    const shippingName = [
      orderState?.shippingInfo?.firstname,
      orderState?.shippingInfo?.lastname,
    ]
      .filter(Boolean)
      .join(" ")
      .trim();

    if (shippingName) return shippingName;

    const userName = [orderState?.user?.firstname, orderState?.user?.lastname]
      .filter(Boolean)
      .join(" ")
      .trim();

    return userName || orderState?.user?.name || "Customer";
  }, [orderState]);

  const customerAddress = useMemo(() => {
    return [
      orderState?.shippingInfo?.address,
      orderState?.shippingInfo?.city,
      orderState?.shippingInfo?.state,
      orderState?.shippingInfo?.pincode,
    ]
      .filter(Boolean)
      .join(", ");
  }, [orderState]);

  const payableAmount = Number(
    orderState?.totalPriceAfterDiscount ?? orderState?.totalPrice ?? 0
  );

  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: 16,
          marginBottom: 20,
        }}
      >
        <div>
          <h3 className="mb-1 title">View Bill</h3>
          <div className="text-muted">
            Bill ID: {orderState?._id || orderId || "-"}
          </div>
        </div>

        <Button
          type="primary"
          disabled={!orderState}
          onClick={() => openOrderBillWindow(orderState)}
        >
          Print Bill
        </Button>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
          gap: 16,
          marginBottom: 20,
        }}
      >
        <div className="bg-white rounded-3 p-3 border">
          <div className="text-muted mb-2">Customer</div>
          <div className="fw-semibold">{customerName}</div>
          <div className="small text-muted mt-1">
            {customerAddress || "No shipping address available"}
          </div>
        </div>

        <div className="bg-white rounded-3 p-3 border">
          <div className="text-muted mb-2">Payment</div>
          <div className="fw-semibold">{orderState?.mode || "ONLINE"}</div>
          <div className="small text-muted mt-1">
            Status: {orderState?.orderStatus || "Ordered"}
          </div>
        </div>

        <div className="bg-white rounded-3 p-3 border">
          <div className="text-muted mb-2">Summary</div>
          <div className="fw-semibold">Rs. {payableAmount.toFixed(2)}</div>
          <div className="small text-muted mt-1">
            Created:{" "}
            {orderState?.createdAt
              ? new Date(orderState.createdAt).toLocaleString()
              : "-"}
          </div>
        </div>
      </div>

      <div>
        <Table
          columns={columns}
          dataSource={dataSource}
          pagination={false}
          rowKey="key"
        />
      </div>

      <div className="bg-white rounded-3 border p-3 mt-4 d-flex justify-content-end">
        <div style={{ minWidth: 280 }}>
          <div className="d-flex justify-content-between mb-2">
            <span>Order Total</span>
            <span>Rs. {(orderState?.totalPrice || 0).toFixed(2)}</span>
          </div>
          <div className="d-flex justify-content-between fw-bold pt-2 border-top">
            <span>Payable Amount</span>
            <span>Rs. {payableAmount.toFixed(2)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ViewOrder;
