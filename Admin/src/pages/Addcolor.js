import { React, useEffect, useState } from "react";
import CustomInput from "../components/CustomInput";
import { useDispatch, useSelector } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import * as yup from "yup";
import { useFormik } from "formik";
import {
  createColor,
  getAColor,
  resetState,
  updateAColor,
} from "../features/color/colorSlice";
import { FaTrash, FaPlus } from "react-icons/fa";

let schema = yup.object().shape({
  title: yup.string().required("Color is Required"),
});

// Preset color palette
const presetColors = [
  "#FF6B6B", "#4ECDC4", "#45B7D1", "#96CEB4", "#FFEAA7",
  "#DDA0DD", "#98D8C8", "#F7DC6F", "#BB8FCE", "#85C1E9",
  "#F8B500", "#00CED1", "#FF69B4", "#32CD32", "#FF4500",
  "#9370DB", "#20B2AA", "#FFD700", "#DC143C", "#000080",
];

const Addcolor = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const getColorId = location.pathname.split("/")[3];
  const newColor = useSelector((state) => state.color);
  const {
    isSuccess,
    isError,
    isLoading,
    createdColor,
    updatedColor,
    colorName,
  } = newColor;

  const [selectedColor, setSelectedColor] = useState("#000000");
  const [customHex, setCustomHex] = useState("");
  const [savedColors, setSavedColors] = useState([]);

  useEffect(() => {
    if (getColorId !== undefined) {
      dispatch(getAColor(getColorId));
    } else {
      dispatch(resetState());
    }
  }, [getColorId]);

  useEffect(() => {
    if (isSuccess && createdColor) {
      toast.success("Color Added Successfully!");
      setSavedColors([...savedColors, { title: selectedColor, _id: Date.now() }]);
    }
    if (isSuccess && updatedColor) {
      toast.success("Color Updated Successfully!");
      navigate("/admin/list-color");
    }
    if (isError) {
      toast.error("Something Went Wrong!");
    }
  }, [isSuccess, isError, isLoading, createdColor]);

  const formik = useFormik({
    enableReinitialize: true,
    initialValues: {
      title: colorName || selectedColor,
    },
    validationSchema: schema,
    onSubmit: (values) => {
      if (getColorId !== undefined) {
        const data = { id: getColorId, colorData: values };
        dispatch(updateAColor(data));
        dispatch(resetState());
      } else {
        dispatch(createColor(values));
        formik.resetForm();
        setTimeout(() => {
          dispatch(resetState());
        }, 300);
      }
    },
  });

  const handlePresetClick = (color) => {
    setSelectedColor(color);
    formik.setFieldValue("title", color);
  };

  const handleColorInput = (e) => {
    const color = e.target.value;
    setSelectedColor(color);
    formik.setFieldValue("title", color);
  };

  const handleHexInput = (e) => {
    let hex = e.target.value;
    setCustomHex(hex);
    if (/^#[0-9A-Fa-f]{6}$/.test(hex)) {
      setSelectedColor(hex);
      formik.setFieldValue("title", hex);
    }
  };

  const clearColor = () => {
    setSelectedColor("#000000");
    setCustomHex("");
    formik.setFieldValue("title", "#000000");
  };

  return (
    <div className="add-color-container">
      <h3 className="mb-4 title">
        {getColorId !== undefined ? "Edit" : "Add"} Color
      </h3>
      
      <div className="row">
        {/* Left Side - Color Picker Section */}
        <div className="col-lg-7">
          <div className="color-picker-card p-4 bg-white rounded-4 shadow-sm">
            {/* Live Preview */}
            <div className="color-preview-section mb-4">
              <label className="form-label fw-semibold text-muted mb-3">
                Color Preview
              </label>
              <div className="d-flex align-items-center gap-4">
                <div 
                  className="color-preview-box rounded-4 shadow-sm"
                  style={{
                    width: "120px",
                    height: "120px",
                    backgroundColor: selectedColor,
                    border: "3px solid #e9ecef",
                    transition: "all 0.3s ease"
                  }}
                />
                <div className="color-info">
                  <p className="mb-1 fw-bold">{selectedColor.toUpperCase()}</p>
                  <p className="mb-0 text-muted small">
                    RGB: {hexToRgb(selectedColor)}
                  </p>
                  <button
                    type="button"
                    className="btn btn-outline-danger btn-sm mt-2"
                    onClick={clearColor}
                  >
                    <FaTrash className="me-1" /> Clear
                  </button>
                </div>
              </div>
            </div>

            {/* Native Color Picker */}
            <div className="mb-4">
              <label className="form-label fw-semibold text-muted">
                Pick a Color
              </label>
              <div className="color-picker-wrapper">
                <input
                  type="color"
                  value={selectedColor}
                  onChange={handleColorInput}
                  className="color-picker-input"
                />
                <span className="picker-hint">Click to open color picker</span>
              </div>
            </div>

            {/* Hex Input */}
            <div className="mb-4">
              <label className="form-label fw-semibold text-muted">
                Enter Hex Code
              </label>
              <div className="input-group">
                <span className="input-group-text bg-light border-end-0">
                  #
                </span>
                <input
                  type="text"
                  className={`form-control border-start-0 ${customHex && !/^#[0-9A-Fa-f]{6}$/.test(customHex) ? 'border-danger' : ''}`}
                  placeholder="Enter hex code (e.g., FF6B6B)"
                  value={customHex}
                  onChange={handleHexInput}
                  maxLength={6}
                />
              </div>
              {customHex && !/^#[0-9A-Fa-f]{6}$/.test(customHex) && (
                <small className="text-danger">Please enter a valid hex code</small>
              )}
            </div>

            {/* Form Submit */}
            <form onSubmit={formik.handleSubmit}>
              <div className="error mb-3 text-danger">
                {formik.touched.title && formik.errors.title}
              </div>
              <button
                className="btn btn-success border-0 rounded-3 py-2 px-4 w-100"
                type="submit"
              >
                <FaPlus className="me-2" />
                {getColorId !== undefined ? "Update" : "Add"} Color
              </button>
            </form>
          </div>
        </div>

        {/* Right Side - Preset Colors */}
        <div className="col-lg-5">
          <div className="preset-colors-card p-4 bg-white rounded-4 shadow-sm h-100">
            <h5 className="mb-3">
              <span className="me-2">🎨</span>
              Preset Colors
            </h5>
            <p className="text-muted small mb-3">
              Click on a color to select it
            </p>
            <div className="preset-colors-grid">
              {presetColors.map((color, index) => (
                <button
                  key={index}
                  type="button"
                  className={`preset-color-btn ${selectedColor === color ? 'selected' : ''}`}
                  style={{ backgroundColor: color }}
                  onClick={() => handlePresetClick(color)}
                  title={color}
                />
              ))}
            </div>
            
            {/* Selected Color Info */}
            <div className="mt-4 p-3 bg-light rounded-3">
              <small className="text-muted d-block mb-1">Selected Color</small>
              <div className="d-flex align-items-center gap-2">
                <div 
                  style={{
                    width: "24px",
                    height: "24px",
                    borderRadius: "4px",
                    backgroundColor: selectedColor,
                    border: "1px solid #dee2e6"
                  }}
                />
                <code className="mb-0">{selectedColor.toUpperCase()}</code>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .add-color-container {
          padding: 20px;
        }
        .color-picker-card, .preset-colors-card {
          border: 1px solid #e9ecef;
        }
        .color-preview-box {
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .color-picker-wrapper {
          position: relative;
          display: inline-block;
        }
        .color-picker-input {
          width: 100%;
          height: 50px;
          border: 2px dashed #ced4da;
          border-radius: 8px;
          cursor: pointer;
          padding: 4px;
        }
        .color-picker-input::-webkit-color-swatch-wrapper {
          padding: 0;
        }
        .color-picker-input::-webkit-color-swatch {
          border: none;
          border-radius: 6px;
        }
        .picker-hint {
          display: block;
          font-size: 12px;
          color: #6c757d;
          margin-top: 8px;
        }
        .preset-colors-grid {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: 10px;
        }
        .preset-color-btn {
          width: 100%;
          aspect-ratio: 1;
          border: 2px solid transparent;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s ease;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .preset-color-btn:hover {
          transform: scale(1.1);
          box-shadow: 0 4px 8px rgba(0,0,0,0.2);
        }
        .preset-color-btn.selected {
          border-color: #000;
          transform: scale(1.1);
          box-shadow: 0 0 0 3px rgba(0,0,0,0.2);
        }
      `}</style>
    </div>
  );
};

// Helper function to convert hex to RGB
function hexToRgb(hex) {
  const result = /^#?([a-f\\d]{2})([a-f\\d]{2})([a-f\\d]{2})$/i.exec(hex);
  if (result) {
    return `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`;
  }
  return "0, 0, 0";
}

export default Addcolor;
