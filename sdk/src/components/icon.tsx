import { ComponentChildren, FunctionComponent, SVGAttributes } from "preact";

type Direction = "up" | "down" | "left" | "right";

export type IconName =
  | "chevron"
  | "check"
  | "x"
  | "card"
  | "qr"
  | "otc"
  | "ewallet"
  | "bank_transfer"
  | "online_banking"
  | "copy"
  | "dummy";

type Props = {
  name: IconName;
  size: number;
  direction?: Direction;
  className?: string;
};

const Icon: FunctionComponent<SVGAttributes<SVGSVGElement> & Props> = (
  props,
) => {
  const { name, size, direction } = props;

  let svgTransform: string;
  switch (direction) {
    case "right":
      svgTransform = "rotate(180 12 12)";
      break;
    case "up":
      svgTransform = "rotate(90 12 12)";
      break;
    case "down":
      svgTransform = "rotate(-90 12 12)";
      break;
    case "left":
    default:
      svgTransform = "rotate(0 12 12)";
      break;
  }

  let iconNode: ComponentChildren;
  switch (name) {
    case "chevron": {
      iconNode = (
        <path
          d="M15 19.5L7.5 12L15 4.5"
          stroke="currentColor"
          stroke-width="1.5"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      );
      break;
    }
    case "check": {
      iconNode = scaleIcon(
        <path
          d="M13.5 4.5L6.5 11.5L3 8"
          stroke="currentColor"
          stroke-width="1.5"
          stroke-linecap="round"
          stroke-linejoin="round"
        />,
        16 / 24,
      );
      break;
    }
    case "x": {
      iconNode = (
        <>
          <path
            d="M18.75 5.25L5.25 18.75"
            stroke="currentColor"
            stroke-width="1.5"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
          <path
            d="M18.75 18.75L5.25 5.25"
            stroke="currentColor"
            stroke-width="1.5"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </>
      );
      break;
    }
    case "card": {
      iconNode = scaleIcon(
        <path
          fill="currentColor"
          d="M17.25 3.75H2.75A1.25 1.25 0 0 0 1.5 5v10a1.25 1.25 0 0 0 1.25 1.25h14.5A1.25 1.25 0 0 0 18.5 15V5a1.25 1.25 0 0 0-1.25-1.25m-.875 9.5a1 1 0 0 1-1 1h-2.5a1 1 0 0 1-1-1V13a1 1 0 0 1 1-1h2.5a1 1 0 0 1 1 1zM1.5 8V6h17v2z"
        />,
        20 / 24,
      );
      break;
    }
    case "qr": {
      iconNode = scaleIcon(
        <>
          <path
            fill="currentColor"
            d="M8.125 3.125h-3.75c-.69 0-1.25.56-1.25 1.25v3.75c0 .69.56 1.25 1.25 1.25h3.75c.69 0 1.25-.56 1.25-1.25v-3.75c0-.69-.56-1.25-1.25-1.25M8.125 10.625h-3.75c-.69 0-1.25.56-1.25 1.25v3.75c0 .69.56 1.25 1.25 1.25h3.75c.69 0 1.25-.56 1.25-1.25v-3.75c0-.69-.56-1.25-1.25-1.25M15.625 3.125h-3.75c-.69 0-1.25.56-1.25 1.25v3.75c0 .69.56 1.25 1.25 1.25h3.75c.69 0 1.25-.56 1.25-1.25v-3.75c0-.69-.56-1.25-1.25-1.25M11.25 14.375a.624.624 0 0 0 .625-.625v-2.5a.624.624 0 1 0-1.25 0v2.5a.624.624 0 0 0 .625.625"
          />
          <path
            fill="currentColor"
            d="M16.25 11.875h-1.875v-.625a.624.624 0 1 0-1.25 0v4.375H11.25a.624.624 0 1 0 0 1.25h2.5a.624.624 0 0 0 .625-.625v-3.125h1.875a.624.624 0 1 0 0-1.25M16.25 14.375a.624.624 0 0 0-.625.625v1.25a.624.624 0 1 0 1.25 0V15a.624.624 0 0 0-.625-.625"
          />
        </>,
        20 / 24,
      );
      break;
    }
    case "otc": {
      iconNode = scaleIcon(
        <>
          <path
            fill="currentColor"
            fill-rule="evenodd"
            d="M16.972 9.547c.092-.107.207-.021.207.12v6.924c0 .283-.23.513-.512.513h-7.18v-5.129a.513.513 0 0 0-.514-.512h-3.59a.513.513 0 0 0-.513.512v5.13H3.332a.514.514 0 0 1-.513-.514V9.853c0-.244.149-.33.331-.168.268.238.586.428.936.556a3.2 3.2 0 0 0 2.209 0c.35-.128.669-.318.936-.556a.56.56 0 0 1 .728 0c.267.238.586.428.935.556a3.2 3.2 0 0 0 2.209 0c.35-.128.669-.318.937-.556a.56.56 0 0 1 .727 0c.267.238.586.428.935.556a3.2 3.2 0 0 0 2.21 0c.349-.128.668-.318.936-.556.04-.036.081-.088.124-.138m-4.409 1.915a.513.513 0 0 0-.512.513v1.283c0 .283.23.512.512.513h2.052c.283 0 .513-.23.513-.513v-1.283a.513.513 0 0 0-.513-.512z"
            clip-rule="evenodd"
          />
          <path
            fill="currentColor"
            d="M16.325 3c.148 0 .293.054.412.153.118.1.204.24.245.398l.99 2.872a.51.51 0 0 1-.333.654 2.4 2.4 0 0 1-.166.495c-.145.31-.357.593-.625.831a2.9 2.9 0 0 1-.936.556 3.2 3.2 0 0 1-2.209 0 2.9 2.9 0 0 1-.936-.556.56.56 0 0 0-.727 0 2.9 2.9 0 0 1-.936.556 3.2 3.2 0 0 1-2.209 0 2.9 2.9 0 0 1-.936-.556.56.56 0 0 0-.728 0 2.9 2.9 0 0 1-.935.556 3.2 3.2 0 0 1-2.21 0 2.9 2.9 0 0 1-.936-.556 2.6 2.6 0 0 1-.624-.831 2.4 2.4 0 0 1-.167-.495.51.51 0 0 1-.33-.654l.99-2.872a.77.77 0 0 1 .244-.397A.64.64 0 0 1 3.675 3z"
          />
        </>,
        20 / 24,
      );
      break;
    }
    case "ewallet": {
      iconNode = scaleIcon(
        <path
          fill="currentColor"
          fill-rule="evenodd"
          d="M11.313 2.07c.94-.23 2.112.266 2.63 1.145H9.331c-1.242 0-2.295.021-3.171.053 1.648-.683 3.44-.78 5.153-1.198M4.338 17.855c1.061.072 2.691.145 4.971.145s3.91-.073 4.972-.145c1.168-.08 2.09-.963 2.186-2.134q.029-.335.054-.747a40 40 0 0 1-2.644-.012c-1.298-.052-2.345-1.039-2.405-2.362a26 26 0 0 1-.023-1.153q.002-.67.023-1.153c.06-1.323 1.107-2.31 2.405-2.362q.745-.029 1.494-.027.654 0 1.15.016a36 36 0 0 0-.054-.748c-.096-1.17-1.018-2.053-2.186-2.133-1.062-.073-2.692-.146-4.972-.146s-3.91.073-4.971.146c-1.169.08-2.09.962-2.187 2.133A53 53 0 0 0 2 11.447c0 1.922.073 3.326.151 4.274.096 1.171 1.018 2.053 2.187 2.134m8.675-5.325c.03.662.544 1.155 1.21 1.181q.508.022 1.274.024.766-.002 1.273-.024c.667-.026 1.18-.52 1.21-1.181q.019-.404.02-.971-.001-.569-.02-.971c-.03-.662-.544-1.156-1.21-1.182a32 32 0 0 0-1.273-.024c-.512 0-.934.01-1.274.024-.667.026-1.18.52-1.21 1.182q-.019.403-.02.97.001.569.02.972m2.041-1.749c.159 0 .311.05.424.137a.42.42 0 0 1 .175.33v.622a.42.42 0 0 1-.175.33.7.7 0 0 1-.424.136.7.7 0 0 1-.423-.137.42.42 0 0 1-.176-.33v-.621c0-.124.063-.242.176-.33a.7.7 0 0 1 .423-.137"
          clip-rule="evenodd"
        />,
        20 / 24,
      );
      break;
    }
    case "bank_transfer": {
      iconNode = scaleIcon(
        <path
          fill="currentColor"
          d="M9.195 1.947a1.46 1.46 0 0 1 1.72 0l6.184 4.514c.814.593.629 1.463-.378 1.466H3.388C2.38 7.924 2.196 7.054 3.01 6.46zm.235 11.196a.2.2 0 0 1-.2.2H7.963a.2.2 0 0 1-.2-.2V9.377c0-.11.09-.2.2-.2H9.23c.11 0 .2.09.2.2zm2.916 0a.2.2 0 0 1-.2.2H10.88a.2.2 0 0 1-.2-.2V9.377c0-.11.09-.2.2-.2h1.267c.11 0 .2.09.2.2zm3.125 0a.2.2 0 0 1-.2.2h-1.475a.2.2 0 0 1-.2-.2V9.377c0-.11.09-.2.2-.2h1.475c.11 0 .2.09.2.2zm-12.916 1.45v1.875c0 .346.28.625.625.625h13.75a.625.625 0 0 0 .625-.625v-1.875s-12.07-.128-15 0m3.958-1.45a.2.2 0 0 1-.2.2H4.838a.2.2 0 0 1-.2-.2V9.377c0-.11.09-.2.2-.2h1.475c.11 0 .2.09.2.2z"
        />,
        20 / 24,
      );
      break;
    }
    case "online_banking": {
      iconNode = scaleIcon(
        <>
          <path
            stroke="currentColor"
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="1.25"
            d="M14.25 17.708a3.75 3.75 0 1 0 0-7.5 3.75 3.75 0 0 0 0 7.5"
          />
          <path
            stroke="currentColor"
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M10.5 13.958H18m-3.75-3.75a5.437 5.437 0 0 0 0 7.5 5.44 5.44 0 0 0 0-7.5"
          />
          <path
            fill="currentColor"
            d="M8.706 14.537c.15.97.574 1.848 1.188 2.556H3.18a.625.625 0 0 1-.625-.625v-1.875c1.115-.049 3.556-.06 6.151-.056M6.346 9.177c.092 0 .167.074.167.166v3.833a.167.167 0 0 1-.167.167H4.805a.167.167 0 0 1-.167-.167V9.343c0-.092.075-.166.167-.166zM9.263 9.177c.092 0 .167.074.167.166v1.69a5.1 5.1 0 0 0-.767 2.31H7.93a.167.167 0 0 1-.167-.167V9.343c0-.092.075-.166.167-.166zM11.484 9.177q-.428.21-.804.495v-.329c0-.092.074-.166.166-.166zM10.055 1.667c.309 0 .61.098.86.28l6.184 4.514c.814.593.629 1.463-.378 1.466H3.388c-1.007-.003-1.192-.873-.379-1.466l6.185-4.513c.25-.183.551-.281.86-.281"
          />
        </>,
        20 / 24,
      );
      break;
    }
    case "copy": {
      iconNode = scaleIcon(
        <>
          <path
            d="M6 9.5H10"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M6 7.5H10"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M10 2.5H12.5C12.6326 2.5 12.7598 2.55268 12.8536 2.64645C12.9473 2.74021 13 2.86739 13 3V13.5C13 13.6326 12.9473 13.7598 12.8536 13.8536C12.7598 13.9473 12.6326 14 12.5 14H3.5C3.36739 14 3.24021 13.9473 3.14645 13.8536C3.05268 13.7598 3 13.6326 3 13.5V3C3 2.86739 3.05268 2.74021 3.14645 2.64645C3.24021 2.55268 3.36739 2.5 3.5 2.5H6"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M5.5 4.5V4C5.5 3.33696 5.76339 2.70107 6.23223 2.23223C6.70107 1.76339 7.33696 1.5 8 1.5C8.66304 1.5 9.29893 1.76339 9.76777 2.23223C10.2366 2.70107 10.5 3.33696 10.5 4V4.5H5.5Z"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </>,
        16 / 24,
      );
      break;
    }
    case "dummy": {
      iconNode = scaleIcon(
        <path
          fill="currentColor"
          d="M17.5 11.875V15C17.5 15.3315 17.3683 15.6495 17.1339 15.8839C16.8995 16.1183 16.5815 16.25 16.25 16.25H3.75C3.41848 16.25 3.10054 16.1183 2.86612 15.8839C2.6317 15.6495 2.5 15.3315 2.5 15V11.875C2.5 11.5435 2.6317 11.2255 2.86612 10.9911C3.10054 10.7567 3.41848 10.625 3.75 10.625H16.25C16.5815 10.625 16.8995 10.7567 17.1339 10.9911C17.3683 11.2255 17.5 11.5435 17.5 11.875ZM16.25 3.75H3.75C3.41848 3.75 3.10054 3.8817 2.86612 4.11612C2.6317 4.35054 2.5 4.66848 2.5 5V8.125C2.5 8.45652 2.6317 8.77446 2.86612 9.00888C3.10054 9.2433 3.41848 9.375 3.75 9.375H16.25C16.5815 9.375 16.8995 9.2433 17.1339 9.00888C17.3683 8.77446 17.5 8.45652 17.5 8.125V5C17.5 4.66848 17.3683 4.35054 17.1339 4.11612C16.8995 3.8817 16.5815 3.75 16.25 3.75Z"
        />,
        20 / 24,
      );
      break;
    }
    default: {
      name satisfies never;
      throw new Error(`Icon with name ${name} does not exist`);
    }
  }

  return (
    <svg
      className={`xendit-icon ${props.className ?? ""}`}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="none"
    >
      <g transform={svgTransform}>{iconNode}</g>
    </svg>
  );
};

// wrap an SVG path in a group that will scale it to fit within a 24x24 viewbox
// e.g. if the original path is designed for a 16x16 viewbox, do `scaleIcon(<path d="..." />, 16 / 24)`.
function scaleIcon(
  children: ComponentChildren,
  scale: number,
): ComponentChildren {
  return <g transform={`scale(${1 / scale} ${1 / scale})`}>{children}</g>;
}

export default Icon;
