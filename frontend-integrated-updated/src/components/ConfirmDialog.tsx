import Modal from "./Modal";

type ConfirmDialogProps = {
  title: string;
  message: string;
  confirmLabel: string;
  tone?: "danger" | "primary";
  onConfirm: () => void;
  onCancel: () => void;
};

function ConfirmDialog({
  title,
  message,
  confirmLabel,
  tone = "danger",
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <Modal
      title={title}
      size="sm"
      onClose={onCancel}
      footer={
        <>
          <button type="button" className="modal-button" onClick={onCancel}>
            Cancel
          </button>
          <button
            type="button"
            className={`modal-button ${tone}`}
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </>
      }
    >
      <p style={{ margin: 0, color: "var(--text-secondary)", fontSize: 14, lineHeight: 1.6 }}>
        {message}
      </p>
    </Modal>
  );
}

export default ConfirmDialog;
