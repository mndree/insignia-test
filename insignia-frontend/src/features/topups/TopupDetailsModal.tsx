import React, { useState } from 'react';
import { TopupRecordDto } from '@/types';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { UserAvatar } from '@/features/users/UserAvatar';
import { formatNumber, formatDateTime } from '@/utils/formatters';
import {
  ArrowDownCircle,
  Copy,
  Check,
  User,
  ShieldCheck,
  FileText,
  Download,
  ExternalLink,
  ImageIcon,
  CheckCircle2,
} from 'lucide-react';

interface TopupDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  topup: TopupRecordDto | null;
}

export const TopupDetailsModal: React.FC<TopupDetailsModalProps> = ({
  isOpen,
  onClose,
  topup,
}) => {
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedUser, setCopiedUser] = useState(false);
  const [isPreviewZoomed, setIsPreviewZoomed] = useState(false);

  if (!topup) return null;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(topup.topupCode || topup.id);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleCopyUser = () => {
    navigator.clipboard.writeText(topup.user?.username || '');
    setCopiedUser(true);
    setTimeout(() => setCopiedUser(false), 2000);
  };

  const handleDownloadAttachment = () => {
    if (!topup.attachment) return;
    const link = document.createElement('a');
    link.href = topup.attachment;
    link.download = `receipt-${topup.topupCode || topup.id}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleOpenNewTab = () => {
    if (!topup.attachment) return;
    const win = window.open();
    if (win) {
      win.document.write(
        `<iframe src="${topup.attachment}" frameborder="0" style="border:0; top:0px; left:0px; bottom:0px; right:0px; width:100%; height:100%;" allowfullscreen></iframe>`
      );
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="lg"
      icon={
        <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
          <ArrowDownCircle className="w-5 h-5" />
        </div>
      }
      title="Top-up Transaction Details"
      description={`Transaction ID: ${topup.topupCode || topup.id}`}
      footer={
        <div className="w-full flex items-center justify-between">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleCopyCode}
            className="gap-2 text-xs text-navy-800"
          >
            {copiedCode ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span>Copied Code</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Topup Code</span>
              </>
            )}
          </Button>
          <Button type="button" variant="primary" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      }
    >
      <div className="space-y-6 text-sm">
        {/* Highlight Amount Card */}
        <div className="bg-emerald-50/60 border border-emerald-200/80 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-800/80 block mb-1">
              Top-up Credit Amount
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-emerald-700 font-mono tracking-tight">
                +{formatNumber(topup.amount)}
              </span>
              <span className="text-sm font-semibold text-emerald-800">units</span>
            </div>
          </div>
          <div className="flex flex-col sm:items-end gap-1.5">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              Completed
            </span>
            <span className="text-[11px] text-slate-500 font-medium">
              Direct Balance Credit
            </span>
          </div>
        </div>

        {/* 2-Column Info Grid: Recipient User & Transaction Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Recipient User Card */}
          <div className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-navy-700 pb-2 border-b border-slate-200/60">
              <User className="w-3.5 h-3.5 text-brand-600" />
              <span>Recipient User</span>
            </div>

            <div className="flex items-center gap-3">
              <UserAvatar
                name={topup.user?.fullName || topup.user?.username || 'User'}
                size="md"
                avatarUrl={topup.user?.avatarUrl}
              />
              <div className="min-w-0 flex-1">
                <span className="block font-bold text-navy-900 truncate">
                  {topup.user?.fullName || topup.user?.username}
                </span>
                <button
                  type="button"
                  onClick={handleCopyUser}
                  className="flex items-center gap-1 text-xs text-brand-600 hover:text-brand-700 font-mono"
                  title="Click to copy username"
                >
                  <span>@{topup.user?.username}</span>
                  {copiedUser ? (
                    <Check className="w-3 h-3 text-emerald-600" />
                  ) : (
                    <Copy className="w-3 h-3 text-slate-400" />
                  )}
                </button>
              </div>
            </div>

            <div className="text-xs space-y-1.5 pt-2 border-t border-slate-200/60 text-slate-600">
              <div className="flex justify-between">
                <span className="text-slate-400">User Code:</span>
                <span className="font-mono font-medium text-navy-800">
                  {topup.user?.userCode || topup.userId.slice(0, 8)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Email:</span>
                <span className="font-medium text-navy-800 truncate max-w-[180px]">
                  {topup.user?.email || '-'}
                </span>
              </div>
              {topup.user?.phone && (
                <div className="flex justify-between">
                  <span className="text-slate-400">Phone:</span>
                  <span className="font-medium text-navy-800">{topup.user.phone}</span>
                </div>
              )}
            </div>
          </div>

          {/* Transaction Metadata Card */}
          <div className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-navy-700 pb-2 border-b border-slate-200/60">
              <ShieldCheck className="w-3.5 h-3.5 text-brand-600" />
              <span>Audit Metadata</span>
            </div>

            <div className="text-xs space-y-2.5 text-slate-600">
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Top-up Code:</span>
                <span className="font-mono font-bold text-navy-900 bg-white px-2 py-0.5 rounded border border-slate-200">
                  {topup.topupCode || topup.id}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-slate-400">Authorized By:</span>
                <span className="inline-flex items-center gap-1 font-semibold text-brand-700 bg-brand-50 px-2 py-0.5 rounded border border-brand-100">
                  <ShieldCheck className="w-3 h-3 text-brand-600" />
                  @{topup.createdBy || 'admin'}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-slate-400">Date & Time:</span>
                <span className="font-medium text-navy-800">
                  {formatDateTime(topup.createdAt)}
                </span>
              </div>

              <div className="pt-2 border-t border-slate-200/60">
                <span className="text-slate-400 block mb-1">Notes / Memo:</span>
                <p className="text-xs text-navy-900 bg-white p-2 rounded-lg border border-slate-200/70 italic">
                  {topup.notes || 'Direct wallet balance top-up'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Attachment / Receipt Section */}
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-brand-600" />
              <h4 className="font-bold text-xs uppercase tracking-wider text-navy-800">
                Proof of Payment / Receipt
              </h4>
            </div>

            {topup.attachment && (
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleDownloadAttachment}
                  className="gap-1.5 text-xs h-7 px-2"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download</span>
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleOpenNewTab}
                  className="gap-1.5 text-xs h-7 px-2"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Open</span>
                </Button>
              </div>
            )}
          </div>

          {topup.attachment ? (
            <div className="space-y-2">
              <div
                className="relative rounded-xl border border-slate-200 overflow-hidden bg-slate-900/5 flex items-center justify-center p-2 cursor-pointer group"
                onClick={() => setIsPreviewZoomed(!isPreviewZoomed)}
                title="Click to toggle size"
              >
                <img
                  src={topup.attachment}
                  alt={`Receipt for ${topup.topupCode || topup.id}`}
                  className={`object-contain rounded-lg transition-all ${
                    isPreviewZoomed ? 'max-h-[500px] w-full' : 'max-h-56'
                  }`}
                />
                <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-semibold gap-1.5 backdrop-blur-[1px]">
                  <ImageIcon className="w-4 h-4" />
                  <span>{isPreviewZoomed ? 'Click to shrink' : 'Click to zoom'}</span>
                </div>
              </div>
              <p className="text-[11px] text-slate-400 text-center">
                Official transaction verification receipt attached at authorization time.
              </p>
            </div>
          ) : (
            <div className="py-6 px-4 bg-slate-50 rounded-xl text-center border border-dashed border-slate-200">
              <FileText className="w-7 h-7 mx-auto text-slate-300 mb-1.5" />
              <p className="text-xs font-medium text-slate-500">
                No payment receipt attachment uploaded for this top-up.
              </p>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};
