import React, { useEffect, useState } from "react";
import { Table, Empty } from "antd";
import { useDispatch, useSelector } from "react-redux";
import { deleteAColor, getColors } from "../features/color/colorSlice";
import { BiEdit } from "react-icons/bi";
import { AiFillDelete } from "react-icons/ai";
import { Link } from "react-router-dom";
import CustomModal from "../components/CustomModal";

const Colorlist = () => {
  const [open, setOpen] = useState(false);
  const [colorId, setcolorId] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const showModal = (e) => {
    setOpen(true);
    setcolorId(e);
  };

  const hideModal = () => {
    setOpen(false);
  };

  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(getColors());
  }, []);

  const colorState = useSelector((state) => state.color.colors);

  // Filter colors based on search term
  const filteredColors = colorState.filter(color =>
    color.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const data1 = filteredColors.map((color, i) => ({
    key: i + 1,
    Color: (
      <div className="d-flex align-items-center gap-3">
        <div
          className="color-swatch rounded-circle shadow-sm"
          style={{
            width: "45px",
            height: "45px",
            backgroundColor: color.title,
            border: "2px solid #e9ecef",
            transition: "transform 0.2s ease"
          }}
        />
        <div>
          <span className="fw-semibold d-block">{color.title.toUpperCase()}</span>
          <small className="text-muted">{color.title}</small>
        </div>
      </div>
    ),
    Action: (
      <div className="d-flex gap-2">
        <Link
          to={`/admin/color/${color._id}`}
          className="btn btn-outline-primary btn-sm"
        >
          <BiEdit />
        </Link>
        <button
          className="btn btn-outline-danger btn-sm"
          onClick={() => showModal(color._id)}
        >
          <AiFillDelete />
        </button>
      </div>
    ),
  }));

  const columns = [
    {
      title: "S.No",
      dataIndex: "key",
      width: 80,
      sorter: (a, b) => a.key - b.key,
    },
    {
      title: "Color",
      dataIndex: "Color",
    },
    {
      title: "Action",
      dataIndex: "Action",
      width: 150,
    },
  ];

  const deleteColor = (e) => {
    dispatch(deleteAColor(e));
    setOpen(false);
    setTimeout(() => {
      dispatch(getColors());
    }, 100);
  };

  return (
    <div className="color-list-container">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h3 className="title mb-0">Colors</h3>
        <Link to="/admin/color" className="btn btn-success">
          + Add New Color
        </Link>
      </div>

      {/* Search Bar */}
      <div className="mb-4">
        <input
          type="text"
          className="form-control"
          placeholder="Search colors..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Color Stats */}
      <div className="row mb-4">
        <div className="col-md-4">
          <div className="stat-card p-3 bg-white rounded-3 shadow-sm">
            <h4 className="mb-0">{colorState.length}</h4>
            <small className="text-muted">Total Colors</small>
          </div>
        </div>
        <div className="col-md-4">
          <div className="stat-card p-3 bg-white rounded-3 shadow-sm">
            <h4 className="mb-0">{filteredColors.length}</h4>
            <small className="text-muted">Filtered Colors</small>
          </div>
        </div>
        <div className="col-md-4">
          <div className="stat-card p-3 bg-white rounded-3 shadow-sm">
            <div className="d-flex align-items-center gap-2">
              <div
                style={{
                  width: "30px",
                  height: "30px",
                  borderRadius: "50%",
                  background: "linear-gradient(45deg, #FF6B6B, #4ECDC4, #45B7D1, #96CEB4)"
                }}
              />
              <small className="text-muted mb-0">Color Palette</small>
            </div>
          </div>
        </div>
      </div>

      {/* Color Grid Preview */}
      <div className="mb-4 p-4 bg-white rounded-3 shadow-sm">
        <h5 className="mb-3">Color Preview</h5>
        <div className="d-flex flex-wrap gap-2">
          {colorState.map((color, index) => (
            <div
              key={index}
              className="color-preview-item rounded-2 shadow-sm"
              style={{
                width: "60px",
                height: "60px",
                backgroundColor: color.title,
                border: "2px solid #fff",
                cursor: "pointer",
                transition: "transform 0.2s ease"
              }}
              title={color.title}
              onMouseEnter={(e) => e.target.style.transform = "scale(1.1)"}
              onMouseLeave={(e) => e.target.style.transform = "scale(1)"}
            />
          ))}
          {colorState.length === 0 && (
            <p className="text-muted">No colors added yet</p>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-3 shadow-sm p-4">
        {filteredColors.length > 0 ? (
          <Table columns={columns} dataSource={data1} pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `Total ${total} colors`
          }} />
        ) : (
          <Empty
            description={searchTerm ? "No colors match your search" : "No colors added yet"}
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          >
            <Link to="/admin/color">
              <button className="btn btn-primary">Add Color</button>
            </Link>
          </Empty>
        )}
      </div>

      <CustomModal
        hideModal={hideModal}
        open={open}
        performAction={() => {
          deleteColor(colorId);
        }}
        title="Are you sure you want to delete this color?"
      />

      <style jsx>{`
        .color-list-container {
          padding: 20px;
        }
        .stat-card {
          border: 1px solid #e9ecef;
        }
        .color-preview-item:hover {
          box-shadow: 0 4px 8px rgba(0,0,0,0.2) !important;
        }
      `}</style>
    </div>
  );
};

export default Colorlist;
