type AlertType = "success" | "error" | "info";

let alertCallback: ((title: string, message: string, type?: AlertType) => void) | null = null;

export const registerAlertCallback = (cb: typeof alertCallback) => {
  alertCallback = cb;
};

export const showAlert = (title: string, message: string, type: AlertType = "success") => {
  if (alertCallback) {
    alertCallback(title, message, type);
  } else {
    // Fallback if provider is not mounted yet
    if (typeof window !== "undefined") {
      window.alert(`${title}\n${message}`);
    }
  }
};
