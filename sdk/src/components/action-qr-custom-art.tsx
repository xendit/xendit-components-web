import {
  AllCSSProperties,
  ComponentChildren,
  JSX,
  TargetedEvent,
} from "preact";
import { TFunction } from "../localization";
import { InternalDialogCloseEvent } from "./core/dialog";
import Icon from "./icon";

export type QrArtComponentProps = {
  channelName: string;
  channelLogo: string;
  amountText: string;
  qr: ComponentChildren;
  merchantName: string;
  t: TFunction;
  nmid?: string;
};

export function hasCustomQrArt(channelCode: string): boolean {
  return getCustomQrArtComponent(channelCode) !== null;
}

export function getCustomQrArtComponent(
  channelCode: string,
): JSX.ElementType<QrArtComponentProps> | null {
  if (channelCode === "QRIS") {
    return QrArtQris;
  }

  if (channelCode === "SGQR") {
    return QrArtPaynow;
    // return QrArtSgqr;
  }

  if (channelCode === "DUITNOW_QR") {
    return QrArtDuitnow;
  }

  if (channelCode === "PROMPTPAY") {
    return QrArtPromptPay;
  }

  if (channelCode === "QRPH") {
    return QrArtQrPh;
  }

  return null;
}

function QrArtQris(props: QrArtComponentProps) {
  const { channelLogo, channelName, merchantName, amountText, t, nmid } = props;
  // function getMerchantIdLabel() {
  //   const info = parsedQr?.merchantAccountInformation;
  //   if (typeof info === "string") return undefined;
  //   const qrisInfo = info?.["ID.CO.QRIS.WWW"];
  //   if (typeof qrisInfo === "string") return undefined;
  //   if (!qrisInfo?.nmid) return undefined;
  //   return `NMID: ${qrisInfo.nmid}`;
  // }
  // const merchantIdLabel = getMerchantIdLabel();

  const qrisAccentColor = "#DB4849";
  const borderArtWidth = "24px";

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        position: "relative",
        paddingTop: "24px",
        paddingLeft: borderArtWidth,
        paddingRight: borderArtWidth,
        overflow: "hidden",
      }}
    >
      {hardcodedGraphics.closeButton({})}
      <img
        src={channelLogo}
        alt={t("image_alt.channel_logo", { channelName })}
        style={{
          height: "64px",
          alignSelf: "center",
        }}
      />
      <div
        className="xendit-text-center xendit-text-16"
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "4px",
          marginTop: "16px",
        }}
      >
        <div className="xendit-text-semibold">{merchantName}</div>
        {/* {merchantIdLabel ? <div>{merchantIdLabel}</div> : null} */}
        {nmid ? <div className="xendit-text-14">NMID: {nmid}</div> : null}
      </div>
      <div
        style={{
          position: "relative",
          margin: `-${borderArtWidth}`,
          marginBottom: "0",
          padding: borderArtWidth,
        }}
      >
        <div
          style={{
            padding: "20px",
            backgroundColor: "white",
            zIndex: 1,
            position: "relative",
            borderRadius: "4px",
            display: "flex",
            flexDirection: "column",
            gap: "16px",
          }}
        >
          {props.qr}
          <div
            className="xendit-text-semibold xendit-text-center"
            style={{ fontSize: "24px", lineHeight: borderArtWidth }}
          >
            {amountText}
          </div>
        </div>
        <svg
          style={{
            position: "absolute",
            top: "-9%",
            left: 0,
            width: "60%",
            height: "auto",
            pointerEvents: "none",
          }}
          viewBox="0 0 100 100"
        >
          <polygon fill={qrisAccentColor} points="0,0 50,50 0,100" />
        </svg>
        <svg
          style={{
            position: "absolute",
            bottom: 0,
            right: 0,
            width: "30%",
            height: "auto",
            pointerEvents: "none",
          }}
          viewBox="0 0 100 100"
        >
          <polygon fill={qrisAccentColor} points="0,100 100,100 100,0" />
        </svg>
      </div>
    </div>
  );
}

// we should use purple paynow branding for sg, but this might come in handy later
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function QrArtSgqr(props: QrArtComponentProps) {
  const { merchantName, amountText } = props;

  const sgqrAccentColor = "#FD0031";

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        position: "relative",
        paddingTop: "24px",
        paddingLeft: "24px",
        paddingRight: "24px",
        overflow: "hidden",
      }}
    >
      {hardcodedGraphics.sgqr({
        height: "40px",
        alignSelf: "flex-start",
      })}
      {hardcodedGraphics.closeButton({})}
      <div
        className="xendit-text-center xendit-text-16"
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "4px",
          marginTop: "16px",
        }}
      >
        <div className="xendit-text-semibold">{merchantName}</div>
      </div>
      <div
        style={{
          padding: "20px",
          backgroundColor: "white",
          zIndex: 1,
          position: "relative",
          borderRadius: "4px",
          display: "flex",
          flexDirection: "column",
          gap: "16px",
        }}
      >
        {props.qr}
        <div
          className="xendit-text-semibold xendit-text-center"
          style={{ fontSize: "24px", lineHeight: "24px" }}
        >
          {amountText}
        </div>
        <div
          style={{
            backgroundColor: sgqrAccentColor,
            color: "white",
            textAlign: "center",
            fontSize: "20px",
            lineHeight: "28px",
            padding: "8px",
            borderRadius: "4px",
          }}
        >
          SCAN TO PAY
        </div>
      </div>
    </div>
  );
}

function QrArtPaynow(props: QrArtComponentProps) {
  const { merchantName, amountText, channelLogo, channelName, t } = props;

  const paynowAccentColor = "#7C2279";

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        position: "relative",
        paddingTop: "24px",
        paddingLeft: "24px",
        paddingRight: "24px",
        overflow: "hidden",
      }}
    >
      <img
        src={channelLogo}
        alt={t("image_alt.channel_logo", { channelName })}
        style={{
          height: "56px",
          alignSelf: "center",
          marginBottom: "8px",
        }}
      />
      {hardcodedGraphics.closeButton({})}
      <div
        style={{
          padding: "20px",
          backgroundColor: "white",
          zIndex: 1,
          position: "relative",
          borderRadius: "4px",
          display: "flex",
          flexDirection: "column",
          gap: "16px",
        }}
      >
        <div style={{ "--xendit-qr-foreground-color": paynowAccentColor }}>
          {props.qr}
        </div>
      </div>
      <div className="xendit-text-center xendit-text-16">Scan To Pay</div>
      <div
        className="xendit-text-semibold xendit-text-center"
        style={{ fontSize: "24px", lineHeight: "24px", marginTop: "12px" }}
      >
        {amountText}
      </div>
      <div
        className="xendit-text-center xendit-text-16 xendit-text-semibold"
        style={{
          marginTop: "8px",
          marginBottom: "16px",
        }}
      >
        {merchantName}
      </div>
    </div>
  );
}

function QrArtDuitnow(props: QrArtComponentProps) {
  const { merchantName, amountText } = props;

  const duitnowAccentColor = "#ED3066";

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        position: "relative",
        paddingTop: "40px",
        overflow: "hidden",
      }}
    >
      {hardcodedGraphics.closeButton({})}
      <div className="xendit-text-center xendit-text-16">Scan To Pay</div>
      <div
        className="xendit-text-semibold xendit-text-center"
        style={{ fontSize: "24px", lineHeight: "24px", marginTop: "12px" }}
      >
        {amountText}
      </div>
      <div
        className="xendit-text-center xendit-text-16 xendit-text-semibold"
        style={{
          marginTop: "8px",
        }}
      >
        {merchantName}
      </div>
      <svg
        viewBox={"0 0 180 180"}
        style={{ aspectRatio: "1", margin: "32px 14% 24px" }}
      >
        <rect width="180" height="180" fill={duitnowAccentColor} rx={13} />
        <rect x="10" y="10" width="160" height="140" fill="white" rx={4} />
        <path d="M0 180 L20 180 L0 160 Z" fill={duitnowAccentColor} />
        <path d="M10 150 L30 150 L10 130 Z" fill="white" />
        <foreignObject x="40" y="30" width="100" height="100">
          <div style={{ "--xendit-qr-foreground-color": duitnowAccentColor }}>
            {props.qr}
          </div>
        </foreignObject>
        <foreignObject
          x="0"
          y="160"
          height="10px"
          width="180px"
          style={{ overflow: "visible" }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              height: "10px",
            }}
          >
            {hardcodedGraphics.malaysiaNationalQrText({ width: "auto" })}
          </div>
        </foreignObject>
      </svg>
    </div>
  );
}

function QrArtPromptPay(props: QrArtComponentProps) {
  const { merchantName, amountText, channelLogo, channelName, t } = props;

  const promptPayAccentColor = "#1C3C63";

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          backgroundColor: promptPayAccentColor,
          padding: "8px",
          height: "64px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          borderTopLeftRadius: "8px",
          borderTopRightRadius: "8px",
        }}
      >
        {hardcodedGraphics.promptpay({
          height: "48px",
        })}
        {hardcodedGraphics.closeButton({ color: "white" })}
      </div>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          padding: "0 16px",
        }}
      >
        <img
          src={channelLogo}
          alt={t("image_alt.channel_logo", { channelName })}
          style={{
            height: "56px",
            alignSelf: "center",
            marginTop: "16px",
          }}
        />
        <div style={{ padding: "16px 42px" }}>{props.qr}</div>
        <div
          className="xendit-text-center xendit-text-semibold"
          style={{
            fontSize: "20px",
            lineHeight: "24px",
            marginBottom: "12px",
            display: "flex",
            flexDirection: "column",
            gap: "8px",
          }}
        >
          {amountText}
          <div className="xendit-text-16">{merchantName}</div>
        </div>
      </div>
    </div>
  );
}

export function QrArtQrPh(props: QrArtComponentProps) {
  const { merchantName, amountText, channelLogo, channelName, t } = props;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        position: "relative",
        paddingTop: "24px",
        paddingLeft: "24px",
        paddingRight: "24px",
        paddingBottom: "12px",
        overflow: "hidden",
      }}
    >
      <img
        src={channelLogo}
        alt={t("image_alt.channel_logo", { channelName })}
        style={{
          height: "48px",
          alignSelf: "center",
          marginBottom: "16px",
        }}
      />
      {hardcodedGraphics.closeButton({})}
      <div
        style={{
          backgroundColor: "white",
          border: "4px solid rgb(0,0,0,0.15)",
          zIndex: 1,
          position: "relative",
          borderRadius: "12px",
          display: "flex",
          flexDirection: "column",
          gap: "16px",
          padding: "24px",
        }}
      >
        <div
          className="xendit-text-center"
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "16px",
          }}
        >
          <div
            className="xendit-text-semibold"
            style={{ fontSize: "20px", lineHeight: "28px" }}
          >
            {merchantName}
          </div>
          <div
            className="xendit-text-bold"
            style={{ fontSize: "24px", lineHeight: "32px" }}
          >
            {amountText}
          </div>
        </div>
        <div style={{ position: "relative" }}>
          {props.qr}
          {hardcodedGraphics.qrph({
            position: "absolute",
            top: "50%",
            left: "50%",
            width: "12%",
            height: "12%",
            aspectRatio: "1",
            transform: "translate(-50%, -50%)",
            zIndex: "3",
            backgroundColor: "white",
            padding: "8px",
            borderRadius: "6px",
          })}
        </div>
      </div>
    </div>
  );
}

function fireCloseDialogEvent(e: TargetedEvent) {
  e.target?.dispatchEvent(new InternalDialogCloseEvent());
}

const hardcodedGraphics: Record<
  string,
  (styles: AllCSSProperties) => JSX.Element
> = {
  closeButton: (style) => (
    <button
      aria-label="Close"
      onClick={fireCloseDialogEvent}
      className="xendit-dialog-floating-close"
      style={style}
    >
      <Icon name="x" size={20} />
    </button>
  ),
  sgqr: (style) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="83"
      height="40"
      fill="none"
      style={style}
    >
      <path
        fill="#FD0031"
        d="M18.395 39.983c-1.224-.14-2.626-.38-3.422-.587-3.582-.931-6.767-2.787-9.275-5.403-2.74-2.858-4.46-6.15-5.268-10.084C.174 22.663 0 21.206 0 20.11c0-1.08.183-2.682.33-3.479.426-2.313 1.002-4.05 1.922-5.793 2.09-3.962 5.07-6.896 8.903-8.768C15.535-.069 20.427-.564 25.188.65c.627.16 1.23.33 1.339.378.109.049.466.189.793.311 1.247.468 4.159 2.023 4.066 2.173-.022.036.02.066.093.066.149 0 .554.297 1.143.838.215.197.408.343.428.323.085-.085 1.9 1.72 2.529 2.515.833 1.051 1.838 2.587 2.344 3.583 1.04 2.045 1.845 4.59 1.99 6.29.034.381.078.827.099.99.301 2.344-.09 5.848-.936 8.368-.52 1.549-1.374 3.302-2.212 4.541-3.84 5.68-9.678 8.864-16.436 8.966-.955.014-1.87.011-2.033-.008m-3.521-11.997a4.97 4.97 0 0 0 2.763-2.024c.525-.767.739-1.481.747-2.498.006-.77-.029-.97-.26-1.464-.625-1.341-1.287-1.932-2.865-2.556-.537-.213-1.018-.387-1.068-.387-.193 0-2.957-.924-3.333-1.114-.519-.262-.864-.535-1.013-.8-.285-.508-.048-1.383.475-1.756.386-.274.82-.588 1.777-.588.68 0 1.93.388 3.025.94 1.057.53 1.241.621 1.339.469.023-.036.182-.319.404-.614.59-.783.897-1.342.832-1.512-.085-.22-.783-.692-1.713-1.16-1.789-.901-4.057-1.193-5.523-.71-1.955.642-3.242 1.871-3.68 3.513-.284 1.066-.054 2.359.603 3.384.707 1.104 1.445 1.467 5.606 2.76 1.291.402 1.656.595 2.01 1.066.822 1.092.13 2.172-1.585 2.47-.81.141-1.74.052-2.655-.255-.72-.241-1.972-.906-2.464-1.308-.154-.127-.335-.23-.401-.23-.097 0-1.142 1.204-1.599 1.843-.146.204.02.414.795 1 .693.525 1.724 1.069 2.591 1.368 1.351.467 3.915.547 5.192.163m13.686.177c1.398-.22 3.134-.984 4.219-1.856l.59-.475.082-.739c.09-.818.026-5.764-.078-5.93-.043-.072-1.146-.106-3.381-.106h-3.317l-.01.619c-.006.34-.028.94-.05 1.331-.024.447.002.737.07.779.059.036.928.06 1.931.05l1.824-.016-.019 1.267c-.021 1.454.04 1.345-1.068 1.891-.412.185-1.417.367-2.231.367-1.306 0-1.558-.027-2.061-.223-.742-.288-1.009-.457-1.592-1.008-.946-.893-1.469-2.297-1.468-3.943 0-1.703.476-2.94 1.52-3.95 1.032-.997 1.761-1.267 3.403-1.262 1.36.005 2.474.36 3.674 1.174.203.138.42.25.48.249.176-.003 1.647-1.844 1.647-2.062 0-.57-2.065-1.734-3.818-2.153-.966-.231-1.233-.256-2.33-.213-.924.035-1.405.103-1.885.266-2.384.811-4.35 2.497-5.259 4.51-.562 1.243-.798 3.178-.597 4.897.233 2.004 1.233 3.701 2.976 5.05.813.63 2.018 1.195 2.979 1.397.96.203 2.775.245 3.769.089m26.951-.466c-.28-.26-.638-.613-.794-.787-.304-.338-.413-.34-.89-.01-.82.568-2.916 1.168-4.076 1.168-1.205 0-3.068-.358-4.134-.95-1.996-1.107-3.6-3.424-3.882-5.96-.421-3.777 1.39-6.944 4.74-8.292 1.087-.438 2.055-.643 3.01-.636 2.095.015 4.211.768 5.616 2 .712.624 1.63 2.082 2.015 3.2.249.723.501 2.097.501 2.73 0 1.134-.536 3.078-1.147 4.157-.187.33-.34.64-.34.687s.279.316.62.598c.999.825 1 .828.322 1.665-.513.634-.805.9-.99.9-.033 0-.29-.212-.57-.47m-3.984-2.258c.727-.362.805-.61.32-1.01-.18-.15-.641-.564-1.023-.922-.863-.809-.804-.931-.554-1.218.144-.165.835-.956.941-1.084.242-.29.67-.002 2.108 1.398.607.592.783.546 1.223-.317.327-.643.352-1.452.384-1.827.023-.269-.013-1.368-.085-1.694-.65-2.936-3.836-4.965-6.546-4.167-1.22.359-2.147.982-2.857 1.92-.874 1.156-1.161 2.046-1.155 3.579.006 1.816.463 2.952 1.676 4.167 1.241 1.243 2.006 1.542 3.833 1.496 1.043-.026 1.204-.056 1.735-.321m8.396 2.254-1.017-.028V12.423l1.711-.002c2.44-.002 6.251.191 7.066.358 1.721.352 2.764 1.24 3.381 2.877.264.699.322 1.883.133 2.702-.157.68-.635 1.63-1.05 2.089-.432.478-1.36 1.107-1.985 1.345-.236.09-.43.224-.43.3 0 .074.211.435.469.803.257.367.788 1.135 1.18 1.707.678.99 1.064 1.533 1.808 2.536.182.247.312.468.288.492-.071.071-2.179.136-2.52.077-.278-.048-.507-.332-2.08-2.579-.974-1.388-1.84-2.562-1.928-2.609-.14-.075-1.422-.117-3.092-.1l-.57.005v2.612c0 2.409-.014 2.616-.174 2.649-.095.02-.63.024-1.19.008m7.165-7.829c.69-.327 1.353-.996 1.544-1.558.337-.987-.015-2.293-.78-2.897-.694-.547-1.127-.627-3.838-.716-1.364-.044-2.515-.044-2.56 0-.06.059-.114 3.938-.073 5.28.004.16.194.173 2.559.173h2.553z"
      />
    </svg>
  ),
  promptpay: (style) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="158"
      height="48"
      fill="none"
      style={style}
    >
      <title>Thai QR Payment</title>
      <path
        fill="#fff"
        d="M66.998 27.875h5.312s2.406.204 3.508 1.709c.744 1.015.904 3.592 0 4.825-1.315 1.792-3.508 1.91-3.508 1.91h-2.806v5.93h-2.506zm7.016 4.121c.013-2.277-4.51-1.81-4.51-1.81v3.62s4.495.606 4.51-1.81m1.904 10.253 5.713-14.374h1.804l5.712 14.374h-2.806l-1.203-3.317h-5.211l-1.203 3.317zm8.419-5.428-1.804-5.026-1.804 5.026zm8.72-.2-5.313-8.746h3.107l3.458 5.93 3.458-5.93h3.106l-5.311 8.745v5.63h-2.506zm9.721-8.746h3.508l3.758 10.052 3.758-10.052h3.508v14.374h-2.505V31.795l-3.609 9.148h-2.305l-3.608-9.148V42.25h-2.505zm18.14 0h9.521v2.312h-6.815v3.82h6.414v2.11h-6.414v3.82h6.815v2.313h-9.521zm12.728 14.374V27.875h2.506l5.913 9.851v-9.851h2.506v14.374h-2.506l-5.913-9.85v9.85zm17.339-12.062h-4.41v-2.312h11.426v2.312h-4.41v12.062h-2.606zm-12.199-8.746s-1.371 1.096-4.538 1.125c-4.245-.098-6.073-2.265-7.306-5.755-.933-3.267-.053-9.45 5.368-10.801.12-.03 4.794-1.17 7.856 2.077 3.438 3.814 2.405 10.02.687 11.663-.01.038 2.014 2.208 2.014 2.208l-1.65 1.762zm-2.033-2.122-2.073-2.009 1.746-1.777 2.139 2.021s.849-.739.826-3.423c-.017-1.88-.617-3.54-1.654-4.431-1.354-1.163-3.965-1.431-5.62-.578-1.409.725-2.225 2.063-2.493 4.084-.395 2.711.753 5.79 3.552 6.645 1.247.358 2.568.315 3.577-.532m9.02 2.926V6.061h5.012s1.956-.045 3.107.503c2.368 1.127 2.895 2.537 2.906 4.272.003 3.071-2.906 4.071-2.906 4.071l4.109 7.338h-3.213l-4.003-6.835h-1.905v6.835zm7.065-9.55c1.231-.51 1.773-2.837-.186-3.719-.864-.389-3.772-.301-3.772-.301v4.322s3.204.242 3.958-.301m-80.829-4.02h-5.011V6.06h13.03v2.614h-5.012v13.57h-3.007zM82.432 6.06h2.807v6.635h7.216V6.06h2.806v16.184h-2.806v-6.634h-7.216v6.634h-2.807zm21.749 0h2.105l6.514 16.184h-3.207l-1.503-3.418h-5.713l-1.504 3.418h-3.207zm3.107 9.952-2.055-5.529-2.054 5.529zm7.817-9.952h2.907v16.184h-2.907s.025-16.184 0-16.184"
      />
      <path
        fill="#fff"
        stroke="#00427a"
        stroke-width=".879"
        d="M12.552 47.472s-5.185-.205-8.519-3.518S.525 35.41.525 35.41V12.59s.221-5.224 3.508-8.544 8.52-3.518 8.52-3.518h22.85s5.209.163 8.519 3.518 3.508 8.545 3.508 8.545v20.708l14.332 14.173z"
      />
      <path
        fill="#00a796"
        d="M26.602 42.245v-8.544h2.37c2.781 0 3.153-.15 3.766-.957.603-.792.873-1.295.88-3.645.002-1.204 0-2.435 0-2.435l14.799 15.581z"
      />
      <path
        fill="#00427a"
        d="M10.598 41.825c-2.198-.713-3.83-2.34-4.576-4.563-.281-.838-.315-1.102-.268-5.371.02-1.786.042-5.282 0-5.227h8.519v2.379c0 2.564.1 2.887.85 3.698.661.714 1.243.96 3.553.96h2.613v8.544h-5.045c-4.33 0-4.998-.21-5.646-.42M5.754 18.499c0-4.572.018-6.837.247-7.65.614-2.182 2.227-3.908 4.402-4.714.756-.28 1.048-.38 5.774-.38h5.111v8.544h-2.485c-2.594 0-2.899.105-3.676.886-.748.753-.745 1.127-.854 3.745v2.406h-8.52zm27.862 2.837s.006-1.225 0-2.726c-.01-2.47-.478-2.923-.959-3.427-.48-.505-.668-.874-3.35-.884-.943-.003-2.707 0-2.707 0V5.755h4.25c2.453 0 4.771.063 5.313.145 1.34.204 2.72.892 3.682 1.839.921.906 1.816 2.611 2.017 3.846.073.443.274 2.04.273 3.552-.003 2.768 0 6.199 0 6.199z"
      />
    </svg>
  ),
  malaysiaNationalQrText: (style) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="209"
      height="19"
      fill="none"
      viewBox="0 0 209 19"
      style={style}
    >
      <title>Malaysia National QR</title>
      <path
        fill="#fff"
        d="M1.16 14.58q-.56 0-.86-.32t-.3-.88V1.36Q0 .78.32.48.64.16 1.2.16q.5 0 .78.2.3.18.54.64l4.94 9.14h-.64L11.76 1q.24-.46.52-.64.28-.2.78-.2.56 0 .86.32.3.3.3.88v12.02q0 .56-.3.88-.28.32-.86.32-.56 0-.86-.32t-.3-.88V4.12h.44l-4.2 7.66a1.6 1.6 0 0 1-.42.5q-.22.16-.6.16t-.62-.16a1.6 1.6 0 0 1-.42-.5L1.84 4.1h.48v9.28q0 .56-.3.88-.28.32-.86.32m19.643.04q-1.06 0-1.9-.4a3.44 3.44 0 0 1-1.3-1.12 2.8 2.8 0 0 1-.46-1.58q0-1.08.56-1.7.56-.64 1.82-.92t3.38-.28h1v1.44h-.98q-1.239 0-1.98.12t-1.06.42q-.3.28-.3.8 0 .66.46 1.08t1.28.42q.66 0 1.16-.3.52-.32.82-.86t.3-1.24V8.2q0-1-.44-1.44t-1.48-.44q-.579 0-1.26.14-.66.14-1.4.48-.38.18-.68.1a.77.77 0 0 1-.44-.32 1.05 1.05 0 0 1-.16-.56q0-.3.16-.58.16-.3.54-.44a9 9 0 0 1 1.76-.54 8.6 8.6 0 0 1 1.56-.16q1.44 0 2.36.44a2.9 2.9 0 0 1 1.4 1.34q.46.88.46 2.28v4.8q0 .62-.3.96-.3.32-.86.32t-.88-.32q-.3-.34-.3-.96v-.96h.16q-.14.7-.56 1.22a2.7 2.7 0 0 1-1.02.78q-.62.28-1.42.28m11.558 0q-1.66 0-2.5-.94-.84-.96-.84-2.8V1.42q0-.62.32-.94t.92-.32.92.32q.34.32.34.94v9.34q0 .92.38 1.36.4.44 1.12.44h.3l.28-.04q.28-.04.38.16.1.18.1.76 0 .5-.2.78-.201.28-.66.34l-.42.04q-.22.02-.44.02m6.766 0q-1.06 0-1.9-.4a3.45 3.45 0 0 1-1.3-1.12 2.8 2.8 0 0 1-.46-1.58q0-1.08.56-1.7.56-.64 1.82-.92t3.38-.28h1v1.44h-.98q-1.239 0-1.98.12t-1.06.42q-.3.28-.3.8 0 .66.46 1.08t1.28.42q.66 0 1.16-.3.52-.32.82-.86t.3-1.24V8.2q0-1-.44-1.44t-1.48-.44q-.579 0-1.26.14-.66.14-1.4.48-.38.18-.68.1a.77.77 0 0 1-.44-.32 1.05 1.05 0 0 1-.16-.56q0-.3.16-.58.16-.3.54-.44a9 9 0 0 1 1.76-.54 8.6 8.6 0 0 1 1.56-.16q1.44 0 2.36.44a2.9 2.9 0 0 1 1.4 1.34q.46.88.46 2.28v4.8q0 .62-.3.96-.3.32-.86.32t-.88-.32q-.3-.34-.3-.96v-.96h.16q-.14.7-.56 1.22a2.7 2.7 0 0 1-1.02.78q-.62.28-1.42.28m10.6 3.56q-.44 0-.72-.24a.91.91 0 0 1-.34-.6q-.04-.38.14-.8l1.36-3.02v1.04l-3.64-8.42q-.18-.44-.12-.82a.89.89 0 0 1 .36-.6q.32-.24.86-.24.46 0 .74.22.28.2.5.78l2.7 6.74h-.6l2.76-6.76q.22-.56.52-.76.3-.22.8-.22.44 0 .7.24.26.22.32.6.06.36-.14.8l-4.86 11.1q-.26.56-.56.76t-.78.2m11.932-3.56a10 10 0 0 1-1.82-.18 5.4 5.4 0 0 1-1.72-.62 1.26 1.26 0 0 1-.46-.46 1.14 1.14 0 0 1-.1-.54 1 1 0 0 1 .2-.48.83.83 0 0 1 .44-.26q.28-.06.6.1a7.3 7.3 0 0 0 1.5.54q.7.14 1.38.14.96 0 1.42-.32.48-.34.48-.88 0-.46-.32-.7-.3-.26-.92-.38l-2-.38q-1.24-.24-1.9-.9-.64-.68-.64-1.74 0-.96.52-1.66.54-.7 1.48-1.08t2.16-.38q.88 0 1.64.2.78.18 1.5.58.3.16.4.42.12.26.06.54-.06.26-.24.48a.84.84 0 0 1-.46.26q-.26.04-.6-.12a5.4 5.4 0 0 0-1.2-.46 4.5 4.5 0 0 0-1.08-.14q-.98 0-1.46.34-.46.34-.46.9 0 .42.28.7t.86.38l2 .38q1.3.24 1.96.88.68.64.68 1.72 0 1.46-1.14 2.3-1.14.82-3.04.82m7.926-.06q-.6 0-.92-.36t-.32-1V5.86q0-.66.32-1 .32-.36.92-.36t.92.36q.34.34.34 1v7.34q0 .64-.32 1t-.94.36m0-11.92q-.7 0-1.1-.34-.38-.36-.38-.98 0-.64.38-.98.4-.34 1.1-.34.72 0 1.1.34t.38.98q0 .62-.38.98-.38.34-1.1.34m7.578 11.98q-1.06 0-1.9-.4a3.44 3.44 0 0 1-1.3-1.12 2.8 2.8 0 0 1-.46-1.58q0-1.08.56-1.7.56-.64 1.82-.92t3.38-.28h1v1.44h-.98q-1.24 0-1.98.12t-1.06.42q-.3.28-.3.8 0 .66.46 1.08t1.28.42q.66 0 1.16-.3.52-.32.82-.86t.3-1.24V8.2q0-1-.44-1.44t-1.48-.44q-.58 0-1.26.14-.66.14-1.4.48-.38.18-.68.1a.77.77 0 0 1-.44-.32 1.05 1.05 0 0 1-.16-.56q0-.3.16-.58.159-.3.54-.44a9 9 0 0 1 1.76-.54 8.6 8.6 0 0 1 1.56-.16q1.44 0 2.36.44a2.9 2.9 0 0 1 1.4 1.34q.46.88.46 2.28v4.8q0 .62-.3.96-.3.32-.86.32t-.88-.32q-.3-.34-.3-.96v-.96h.16q-.14.7-.56 1.22a2.7 2.7 0 0 1-1.02.78q-.62.28-1.42.28m15.587-.04q-.58 0-.9-.32-.3-.32-.3-.92V1.44q0-.62.3-.94.32-.34.82-.34.46 0 .68.18.24.16.56.56l7.66 9.94h-.52V1.38q0-.58.3-.9.32-.32.9-.32t.88.32.3.9v12q0 .56-.28.88t-.76.32q-.46 0-.74-.18-.26-.18-.58-.58l-7.64-9.94h.5v9.46q0 .6-.3.92t-.88.32m17.241.04q-1.06 0-1.9-.4a3.44 3.44 0 0 1-1.3-1.12 2.8 2.8 0 0 1-.46-1.58q0-1.08.56-1.7.56-.64 1.82-.92t3.38-.28h1v1.44h-.98q-1.24 0-1.98.12t-1.06.42q-.3.28-.3.8 0 .66.46 1.08t1.28.42q.66 0 1.16-.3.52-.32.82-.86t.3-1.24V8.2q0-1-.44-1.44t-1.48-.44q-.58 0-1.26.14-.66.14-1.4.48-.38.18-.68.1a.76.76 0 0 1-.44-.32 1.05 1.05 0 0 1-.16-.56q0-.3.16-.58.159-.3.54-.44a9 9 0 0 1 1.76-.54 8.6 8.6 0 0 1 1.56-.16q1.44 0 2.36.44.94.44 1.4 1.34.46.88.46 2.28v4.8q0 .62-.3.96-.3.32-.86.32t-.88-.32q-.3-.34-.3-.96v-.96h.16q-.14.7-.56 1.22a2.7 2.7 0 0 1-1.02.78q-.62.28-1.42.28m12.697 0q-1.3 0-2.18-.44-.86-.44-1.28-1.28-.42-.86-.42-2.12V6.52h-1.04q-.48 0-.74-.24-.26-.26-.26-.7 0-.46.26-.7t.74-.24h1.04V2.82q0-.62.32-.94.34-.32.94-.32t.92.32.32.94v1.82h2.12q.48 0 .74.24t.26.7q0 .44-.26.7-.26.24-.74.24h-2.12v4.12q0 .96.42 1.44t1.36.48q.34 0 .6-.06t.46-.08q.24-.02.4.16.16.16.16.68 0 .4-.14.72-.12.3-.46.42-.26.08-.68.14-.42.08-.74.08m5.19-.06q-.6 0-.92-.36t-.32-1V5.86q0-.66.32-1 .32-.36.92-.36t.92.36q.34.34.34 1v7.34q0 .64-.32 1t-.94.36m0-11.92q-.7 0-1.1-.34-.38-.36-.38-.98 0-.64.38-.98.4-.34 1.1-.34.72 0 1.1.34t.38.98q0 .62-.38.98-.38.34-1.1.34m8.818 11.98q-1.521 0-2.64-.62a4.33 4.33 0 0 1-1.74-1.76q-.62-1.16-.62-2.72 0-1.18.34-2.1a4.5 4.5 0 0 1 1.02-1.6q.66-.68 1.58-1.02.92-.36 2.06-.36 1.52 0 2.64.62 1.119.62 1.74 1.76.62 1.14.62 2.7 0 1.18-.36 2.12a4.5 4.5 0 0 1-1 1.62q-.66.66-1.58 1.02-.92.34-2.06.34m0-1.9q.74 0 1.3-.36t.86-1.06q.32-.72.32-1.78 0-1.6-.68-2.38-.681-.8-1.8-.8-.74 0-1.3.36-.56.34-.88 1.06-.3.7-.3 1.76 0 1.58.68 2.4.68.8 1.8.8m8.803 1.86q-.6 0-.92-.32-.32-.34-.32-.96V5.74q0-.62.32-.94t.9-.32.9.32.32.94V7.1l-.22-.5q.44-1.06 1.36-1.6.94-.56 2.12-.56t1.94.44 1.14 1.34q.38.88.38 2.24v4.84q0 .62-.32.96-.32.32-.92.32t-.94-.32q-.32-.34-.32-.96V8.58q0-1.14-.44-1.66-.42-.52-1.32-.52-1.1 0-1.76.7-.64.68-.64 1.82v4.38q0 1.28-1.26 1.28m14.179.04q-1.06 0-1.9-.4a3.45 3.45 0 0 1-1.3-1.12 2.8 2.8 0 0 1-.46-1.58q0-1.08.56-1.7.56-.64 1.82-.92t3.38-.28h1v1.44h-.98q-1.239 0-1.98.12t-1.06.42q-.3.28-.3.8 0 .66.46 1.08t1.28.42q.66 0 1.16-.3.52-.32.82-.86t.3-1.24V8.2q0-1-.44-1.44t-1.48-.44q-.579 0-1.26.14-.66.14-1.4.48-.38.18-.68.1a.77.77 0 0 1-.44-.32 1.06 1.06 0 0 1-.16-.56q0-.3.16-.58.16-.3.54-.44a9 9 0 0 1 1.76-.54 8.6 8.6 0 0 1 1.56-.16q1.44 0 2.36.44.94.44 1.4 1.34.46.88.46 2.28v4.8q0 .62-.3.96-.3.32-.86.32t-.88-.32q-.3-.34-.3-.96v-.96h.16a2.8 2.8 0 0 1-.56 1.22 2.7 2.7 0 0 1-1.02.78q-.62.28-1.42.28m11.558 0q-1.66 0-2.5-.94-.84-.96-.84-2.8V1.42q0-.62.32-.94t.92-.32.92.32q.34.32.34.94v9.34q0 .92.38 1.36.4.44 1.12.44h.3l.28-.04q.28-.04.38.16.1.18.1.76 0 .5-.2.78-.201.28-.66.34l-.42.04a5 5 0 0 1-.44.02m21.436 2.06q.28.44.22.8t-.32.6a1.13 1.13 0 0 1-.64.32 1.25 1.25 0 0 1-.76-.08q-.38-.14-.64-.56l-1.38-2.22a1.84 1.84 0 0 0-.76-.7q-.46-.22-1.14-.22l1.98-.78q.94 0 1.5.34.56.32 1.08 1.14zm-5.4-2.06q-2.04 0-3.58-.9-1.52-.9-2.36-2.52-.84-1.64-.84-3.84 0-1.66.48-2.98.48-1.34 1.36-2.28a5.9 5.9 0 0 1 2.14-1.46q1.26-.52 2.8-.52 2.06 0 3.58.9 1.52.88 2.36 2.5t.84 3.82q0 1.66-.48 3a6.5 6.5 0 0 1-1.38 2.3 5.9 5.9 0 0 1-2.14 1.48q-1.24.5-2.78.5m0-2.2q1.3 0 2.2-.6.92-.6 1.4-1.74.5-1.14.5-2.72 0-2.4-1.08-3.72-1.06-1.32-3.02-1.32-1.28 0-2.2.6-.92.58-1.42 1.72-.48 1.12-.48 2.72 0 2.38 1.08 3.72t3.02 1.34m11.163 2.16q-.62 0-.96-.34-.32-.36-.32-.98V1.62q0-.64.34-.96.34-.34.96-.34h4.82q2.32 0 3.58 1.12 1.26 1.1 1.26 3.1 0 1.3-.58 2.24-.56.94-1.64 1.44t-2.62.5l.18-.3h.66q.82 0 1.42.4.621.4 1.08 1.26l1.5 2.78q.24.42.22.82a.93.93 0 0 1-.3.66q-.28.24-.82.24t-.88-.22q-.339-.24-.6-.72l-2.02-3.72q-.36-.68-.86-.9-.48-.24-1.24-.24h-1.9v4.48q0 .62-.32.98-.32.34-.96.34m1.28-7.7h3.12q1.38 0 2.08-.56.72-.58.72-1.72 0-1.12-.72-1.68-.7-.58-2.08-.58h-3.12z"
      />
    </svg>
  ),
  qrph: (style) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="44"
      height="44"
      viewBox="0 0 44 44"
      fill="none"
      style={style}
    >
      <path
        fill="#f4ea11"
        d="M21.394 32.393c5.599 0 10.137-4.553 10.137-10.17 0-5.615-4.538-10.168-10.137-10.168s-10.138 4.553-10.138 10.169 4.539 10.169 10.138 10.169"
      />
      <path
        fill="#1f4485"
        fill-rule="evenodd"
        d="m23.73.545 5.235 3.8-5.236 3.799C21.811 8.085 12.962 8.12 9.4 8.136a1.545 1.545 0 0 0-1.54 1.501c-.12 3.68-.401 13.243-.284 18.174H0V7.138C0 .88 6.239.545 6.239.545z"
        clip-rule="evenodd"
      />
      <path
        fill="#cf2130"
        fill-rule="evenodd"
        d="M35.649 16.636h7.13V35.41c-.42 4.05-3.48 6.964-7.13 8.046H20.052l-5.347-3.8 5.347-3.352s9.29-.002 13.815-.447q1.177-.51 1.336-1.788a171 171 0 0 0 .446-17.432"
        clip-rule="evenodd"
      />
    </svg>
  ),
};
