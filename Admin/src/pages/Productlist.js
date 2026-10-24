import React, { useEffect, useMemo, useState } from "react";
import { Table, Input, Switch, Tag, Button, Space, Select } from "antd";
import { DownloadOutlined } from "@ant-design/icons";
import { BiEdit } from "react-icons/bi";
import { AiFillDelete } from "react-icons/ai";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import JsBarcode from "jsbarcode";
import { deleteAProduct, getProducts } from "../features/product/productSlice";
import { delImg } from "../features/upload/uploadSlice";
import CustomModal from "../components/CustomModal";
import BarcodeModal from "../components/BarcodeModal";
import { base_url } from "../utils/baseUrl";
import { downloadCsv, LOW_STOCK_LIMIT } from "../utils/csv";

const totalStock = (p) =>
  p.sizeStock?.length ? p.sizeStock.reduce((t, s) => t + (s.quantity || 0), 0) : p.quantity || 0;

const downloadBarcode = (barcode) => {
  const canvas = document.createElement("canvas");
  JsBarcode(canvas, barcode, { format: "CODE128", width: 2, height: 80, displayValue: true });
  const link = document.createElement("a");
  link.href = canvas.toDataURL("image/png");
  link.download = `${barcode}.png`;
  link.click();
};

const Productlist = () => {
  const dispatch = useDispatch();
  const productState = useSelector((state) => state?.product?.products);

  const [deleteId, setDeleteId] = useState(null);
  const [barcode, setBarcode] = useState(null); // { code, title }
  const [search, setSearch] = useState("");
  const [visibility, setVisibility] = useState(null);
  const [selectedKeys, setSelectedKeys] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    dispatch(getProducts());
  }, [dispatch]);

  const products = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (productState || []).filter((p) => {
      if (visibility === "online" && !p.inventory?.online) return false;
      if (visibility === "offline" && p.inventory?.online) return false;
      if (visibility === "low" && totalStock(p) > LOW_STOCK_LIMIT) return false;
      if (!q) return true;
      return [p.title, p.brand, p.category, p.barcode].some((f) => f?.toLowerCase().includes(q));
    });
  }, [productState, search, visibility]);

  // Only the inventory flag is sent, so nothing else on the product changes
  const setOnline = async (ids, online) => {
    setSaving(true);
    try {
      await Promise.all(ids.map((id) => axios.put(`${base_url}product/${id}`, { inventory: { online } })));
      toast.success(
        `${ids.length} product${ids.length > 1 ? "s" : ""} ${online ? "shown in" : "hidden from"} the online store`
      );
      setSelectedKeys([]);
      dispatch(getProducts());
    } catch (err) {
      toast.error(err?.response?.data?.message || "Could not update products");
    } finally {
      setSaving(false);
    }
  };

  const deleteProduct = async (id) => {
    setDeleteId(null);
    await dispatch(deleteAProduct(id));
    dispatch(delImg(id));
    dispatch(getProducts());
  };

  const exportCsv = () =>
    downloadCsv(
      "products.csv",
      products.map((p) => ({
        title: p.title,
        brand: p.brand,
        category: p.category,
        barcode: p.barcode || "",
        price: p.price,
        stock: totalStock(p),
        sizes: p.sizeStock?.map((s) => `${s.size}:${s.quantity}`).join(" ") || "",
        sold: p.sold || 0,
        online: p.inventory?.online ? "Yes" : "No",
      })),
      [
        { key: "title", label: "Title" },
        { key: "brand", label: "Brand" },
        { key: "category", label: "Category" },
        { key: "barcode", label: "Barcode" },
        { key: "price", label: "Price" },
        { key: "stock", label: "Stock" },
        { key: "sizes", label: "Sizes" },
        { key: "sold", label: "Sold" },
        { key: "online", label: "Online" },
      ]
    );

  const columns = [
    {
      title: "Product",
      dataIndex: "title",
      sorter: (a, b) => a.title.localeCompare(b.title),
      render: (title, p) => (
        <div className="d-flex align-items-center gap-2">
          {p.images?.[0]?.url && (
            <img src={p.images[0].url} alt="" style={{ width: 40, height: 40, objectFit: "cover", borderRadius: 6 }} />
          )}
          <span>{title}</span>
        </div>
      ),
    },
    { title: "Brand", dataIndex: "brand" },
    { title: "Category", dataIndex: "category" },
    {
      title: "Price",
      dataIndex: "price",
      sorter: (a, b) => a.price - b.price,
      render: (price) => `₹${Number(price).toLocaleString("en-IN")}`,
    },
    {
      title: "Stock",
      key: "stock",
      sorter: (a, b) => totalStock(a) - totalStock(b),
      render: (_, p) => {
        const stock = totalStock(p);
        const color = stock <= 0 ? "red" : stock <= LOW_STOCK_LIMIT ? "orange" : "green";
        return (
          <Tag color={color} title={p.sizeStock?.map((s) => `${s.size}: ${s.quantity}`).join(", ")}>
            {stock <= 0 ? "Out of stock" : `${stock} in stock`}
          </Tag>
        );
      },
    },
    {
      title: "Sold",
      dataIndex: "sold",
      sorter: (a, b) => (a.sold || 0) - (b.sold || 0),
      render: (sold) => sold || 0,
    },
    {
      title: "Online",
      key: "online",
      render: (_, p) => (
        <Switch
          size="small"
          checked={!!p.inventory?.online}
          loading={saving}
          onChange={(checked) => setOnline([p._id], checked)}
        />
      ),
    },
    {
      title: "Barcode",
      dataIndex: "barcode",
      render: (code, p) =>
        code ? (
          <Space size={4}>
            <Button size="small" onClick={() => setBarcode({ code, title: p.title })}>View</Button>
            <Button size="small" onClick={() => downloadBarcode(code)}>Download</Button>
          </Space>
        ) : (
          "-"
        ),
    },
    {
      title: "Action",
      key: "action",
      render: (_, p) => (
        <>
          <Link to={`/admin/product/${p._id}`} className="fs-4 text-success" aria-label="Edit">
            <BiEdit />
          </Link>
          <button
            type="button"
            className="ms-3 fs-4 text-danger bg-transparent border-0"
            aria-label="Delete"
            onClick={() => setDeleteId(p._id)}
          >
            <AiFillDelete />
          </button>
        </>
      ),
    },
  ];

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3">
        <h3 className="title mb-0">Products</h3>
        <Space wrap>
          <Link to="/admin/product">
            <Button type="primary">Add product</Button>
          </Link>
          <Button icon={<DownloadOutlined />} onClick={exportCsv} disabled={!products.length}>
            Export CSV
          </Button>
        </Space>
      </div>

      <div className="d-flex flex-wrap gap-2 mb-3 align-items-center">
        <Input.Search
          allowClear
          placeholder="Search title, brand, category or barcode"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ width: 320 }}
        />
        <Select
          allowClear
          placeholder="All products"
          value={visibility}
          onChange={setVisibility}
          style={{ width: 180 }}
          options={[
            { value: "online", label: "Shown online" },
            { value: "offline", label: "In store only" },
            { value: "low", label: "Low / out of stock" },
          ]}
        />
        {selectedKeys.length > 0 && (
          <Space>
            <span className="desc">{selectedKeys.length} selected</span>
            <Button size="small" loading={saving} onClick={() => setOnline(selectedKeys, true)}>
              Show online
            </Button>
            <Button size="small" loading={saving} onClick={() => setOnline(selectedKeys, false)}>
              Hide from online
            </Button>
          </Space>
        )}
      </div>

      <Table
        rowKey="_id"
        columns={columns}
        dataSource={products}
        rowSelection={{ selectedRowKeys: selectedKeys, onChange: setSelectedKeys }}
        scroll={{ x: 1000 }}
      />

      <CustomModal
        hideModal={() => setDeleteId(null)}
        open={!!deleteId}
        performAction={() => deleteProduct(deleteId)}
        title="Are you sure you want to delete this Product?"
      />
      <BarcodeModal
        open={!!barcode}
        onClose={() => setBarcode(null)}
        barcode={barcode?.code || ""}
        title={barcode?.title || ""}
      />
    </div>
  );
};

export default Productlist;
