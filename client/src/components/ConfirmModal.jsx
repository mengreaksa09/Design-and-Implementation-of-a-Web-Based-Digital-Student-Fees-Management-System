import { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import {
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

export default function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirm Action',
  message = 'Are you sure you want to proceed?',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  type = 'danger', // 'danger', 'warning', 'success'
  showInput = false,
  inputLabel = '',
  inputPlaceholder = '',
  inputValue = '',
  onInputChange = () => {},
  inputRequired = false,
}) {
  const iconStyles = {
    danger: {
      bg: 'bg-red-100',
      icon: 'text-red-600',
      button: 'bg-red-600 hover:bg-red-700 focus:ring-red-500',
    },
    warning: {
      bg: 'bg-yellow-100',
      icon: 'text-yellow-600',
      button: 'bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500',
    },
    success: {
      bg: 'bg-green-100',
      icon: 'text-green-600',
      button: 'bg-green-600 hover:bg-green-700 focus:ring-green-500',
    },
  };

  const styles = iconStyles[type] || iconStyles.danger;

  const IconComponent =
    type === 'success' ? CheckCircleIcon : ExclamationTriangleIcon;

  const handleConfirm = () => {
    if (showInput && inputRequired && !inputValue.trim()) {
      return;
    }
    onConfirm(showInput ? inputValue : true);
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-[9999]" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-25" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                <div className="flex items-start gap-4">
                  <div
                    className={`flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full ${styles.bg}`}
                  >
                    <IconComponent
                      className={`h-6 w-6 ${styles.icon}`}
                      aria-hidden="true"
                    />
                  </div>
                  <div className="flex-1">
                    <Dialog.Title
                      as="h3"
                      className="text-lg font-semibold leading-6 text-gray-900"
                    >
                      {title}
                    </Dialog.Title>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">{message}</p>
                    </div>

                    {showInput && (
                      <div className="mt-4">
                        {inputLabel && (
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            {inputLabel}
                            {inputRequired && (
                              <span className="text-red-500 ml-1">*</span>
                            )}
                          </label>
                        )}
                        <input
                          type="text"
                          value={inputValue}
                          onChange={(e) => onInputChange(e.target.value)}
                          placeholder={inputPlaceholder}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                          autoFocus
                        />
                      </div>
                    )}
                  </div>
                  <button
                    onClick={onClose}
                    className="flex-shrink-0 p-2 bg-red-500 hover:bg-red-600 rounded-lg transition-colors"
                  >
                    <XMarkIcon className="h-5 w-5 text-white" />
                  </button>
                </div>

                <div className="mt-6 flex justify-end gap-3">
                  <button
                    type="button"
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                    onClick={onClose}
                  >
                    {cancelText}
                  </button>
                  <button
                    type="button"
                    className={`px-4 py-2 text-sm font-medium text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                      styles.button
                    } ${
                      showInput && inputRequired && !inputValue.trim()
                        ? 'opacity-50 cursor-not-allowed'
                        : ''
                    }`}
                    onClick={handleConfirm}
                    disabled={showInput && inputRequired && !inputValue.trim()}
                  >
                    {confirmText}
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
