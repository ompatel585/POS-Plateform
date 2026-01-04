import React, { useEffect, useRef } from "react";
import { Modal } from "antd";
import JsBarcode from "jsbarcode";

const BarcodeModal = ({ open, onClose, barcode, title }) => {
  const svgRef = useRef(null);

  useEffect(() => {
    if (barcode && svgRef.current) {
      JsBarcode(svgRef.current, barcode, {
        format: "CODE128",
        width: 2,
        height: 80,
        displayValue: true,
      });
    }
  }, [barcode]);

  return (
    <Modal open={open} onCancel={onClose} footer={null} centered>
      <h5 style={{ textAlign: "center" }}>{title}</h5>
      <div style={{ display: "flex", justifyContent: "center" }}>
        <svg ref={svgRef}></svg>
      </div>
    </Modal>
  );
};

export default BarcodeModal;
