/**
 * Extracts a simple, user-friendly error message from
 * Starknet RPC / contract / paymaster errors.
 */
export function friendlyError(err: unknown): string {
  const raw = err instanceof Error ? err.message : String(err);

  // Try to extract the inner Cairo/contract error message
  // e.g. Message("0x496e70757420746f6f206c6f6e6720666f7220617267756d656e7473")
  const hexMsgMatch = raw.match(/Message\("(0x[0-9a-fA-F]+)"\)/);
  if (hexMsgMatch) {
    try {
      const hex = hexMsgMatch[1].slice(2);
      let text = '';
      for (let i = 0; i < hex.length; i += 2) {
        text += String.fromCharCode(parseInt(hex.slice(i, i + 2), 16));
      }
      if (text.length > 0) return text;
    } catch { /* fall through */ }
  }

  // Common known error patterns → friendly messages
  const patterns: [RegExp, string][] = [
    [/Input too long for arguments/i, 'Text is too long (max 31 characters)'],
    [/Deadline must be in the future/i, 'Deadline must be in the future'],
    [/Bet already settled/i, 'This bet has already been settled'],
    [/Already joined/i, 'You already joined this bet'],
    [/Only creator can settle/i, 'Only the creator can settle this bet'],
    [/Bet does not exist/i, 'This bet does not exist'],
    [/insufficient.*balance/i, 'Insufficient STRK balance'],
    [/ERC20.*amount/i, 'Insufficient STRK balance for this stake'],
    [/paymaster/i, 'Transaction sponsorship failed — try again'],
    [/User rejected/i, 'Transaction was cancelled'],
    [/TRANSACTION_EXECUTION_ERROR/i, 'Transaction failed on-chain — check your inputs'],
    [/Failed to sign/i, 'Failed to sign the transaction — try again'],
    [/network/i, 'Network error — check your connection'],
  ];

  for (const [re, msg] of patterns) {
    if (re.test(raw)) return msg;
  }

  // If the message is short enough, use it directly
  if (raw.length < 120) return raw;

  // Fallback
  return 'Something went wrong — please try again';
}
