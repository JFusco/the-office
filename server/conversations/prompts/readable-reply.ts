/**
 * How a chat reply to Joe should read. He reads it in a narrow panel: the answer comes first, in plain
 * sentences, and a reference is there because a reader needs it, not because it was found. For a reply
 * to Joe only: a report from the delivery team is answered with the evidence it needs.
 */
export const READABLE_REPLY = 'READABLE REPLY: Joe reads this in a narrow chat panel. Open with two or three plain sentences that answer what he asked. After that, only if it is needed, use short paragraphs or a short list with one point each. Name a ticket, pull request or build by its link when you have one, never an invented one; leave out commit hashes, run and merge ids, build numbers and paths to files on the Office machine unless Joe asks for them or one of them is the answer. When this reply hands direction to Morgan, keep every exact identifier Morgan needs to act on it. Use a table only for data that is tabular, with no more than three columns. Do not restate what has not changed unless Joe asks for a full status.';
