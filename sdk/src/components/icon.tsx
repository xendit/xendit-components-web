import { render } from "preact";

type Direction = "up" | "down" | "left" | "right";

type Props = {
  name: IconName;
  size: number;
  direction?: Direction;
  className?: string;
};

const Icon: React.FC<Props> = (props) => {
  const { name, size, direction } = props;

  let svgTransform = undefined;
  switch (direction) {
    case "left":
      svgTransform = "rotate(0 12 12)";
      break;
    case "right":
      svgTransform = "rotate(180 12 12)";
      break;
    case "up":
      svgTransform = "rotate(90 12 12)";
      break;
    case "down":
      svgTransform = "rotate(-90 12 12)";
      break;
  }

  return (
    <svg
      className={`xendit-icon ${props.className ?? ""}`}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
    >
      {/* TODO: figure out why this doens't work. Maybe because of the self signed cert? */}
      {/* <use href={`#xendit-icon-${name}`} transform={svgTransform} /> */}
      <g transform={svgTransform}>
        {iconData.find((icon) => icon.name === name)?.node ?? null}
      </g>
    </svg>
  );
};

function makeIcon<T extends string>(
  id: T,
  children: React.ReactNode,
  scale: number
): { name: T; node: React.ReactNode } {
  return {
    name: id,
    node: (
      <g
        id={`xendit-icon-${id}`}
        transform={`scale(${1 / scale} ${1 / scale})`}
      >
        {children}
      </g>
    )
  };
}

const iconData = [
  makeIcon(
    "chevron",
    <path
      d="M15 19.5L7.5 12L15 4.5"
      stroke-width="1.5"
      stroke-linecap="round"
      stroke-linejoin="round"
    />,
    1
  ),
  makeIcon(
    "card",
    <path d="M17.5 3.75H2.5C2.16848 3.75 1.85054 3.8817 1.61612 4.11612C1.3817 4.35054 1.25 4.66848 1.25 5V15C1.25 15.3315 1.3817 15.6495 1.61612 15.8839C1.85054 16.1183 2.16848 16.25 2.5 16.25H17.5C17.8315 16.25 18.1495 16.1183 18.3839 15.8839C18.6183 15.6495 18.75 15.3315 18.75 15V5C18.75 4.66848 18.6183 4.35054 18.3839 4.11612C18.1495 3.8817 17.8315 3.75 17.5 3.75ZM10.625 13.75H9.375C9.20924 13.75 9.05027 13.6842 8.93306 13.5669C8.81585 13.4497 8.75 13.2908 8.75 13.125C8.75 12.9592 8.81585 12.8003 8.93306 12.6831C9.05027 12.5658 9.20924 12.5 9.375 12.5H10.625C10.7908 12.5 10.9497 12.5658 11.0669 12.6831C11.1842 12.8003 11.25 12.9592 11.25 13.125C11.25 13.2908 11.1842 13.4497 11.0669 13.5669C10.9497 13.6842 10.7908 13.75 10.625 13.75ZM15.625 13.75H13.125C12.9592 13.75 12.8003 13.6842 12.6831 13.5669C12.5658 13.4497 12.5 13.2908 12.5 13.125C12.5 12.9592 12.5658 12.8003 12.6831 12.6831C12.8003 12.5658 12.9592 12.5 13.125 12.5H15.625C15.7908 12.5 15.9497 12.5658 16.0669 12.6831C16.1842 12.8003 16.25 12.9592 16.25 13.125C16.25 13.2908 16.1842 13.4497 16.0669 13.5669C15.9497 13.6842 15.7908 13.75 15.625 13.75ZM2.5 6.875V5H17.5V6.875H2.5Z" />,
    20 / 24
  ),
  makeIcon(
    "dummy",
    <path d="M17.5 11.875V15C17.5 15.3315 17.3683 15.6495 17.1339 15.8839C16.8995 16.1183 16.5815 16.25 16.25 16.25H3.75C3.41848 16.25 3.10054 16.1183 2.86612 15.8839C2.6317 15.6495 2.5 15.3315 2.5 15V11.875C2.5 11.5435 2.6317 11.2255 2.86612 10.9911C3.10054 10.7567 3.41848 10.625 3.75 10.625H16.25C16.5815 10.625 16.8995 10.7567 17.1339 10.9911C17.3683 11.2255 17.5 11.5435 17.5 11.875ZM16.25 3.75H3.75C3.41848 3.75 3.10054 3.8817 2.86612 4.11612C2.6317 4.35054 2.5 4.66848 2.5 5V8.125C2.5 8.45652 2.6317 8.77446 2.86612 9.00888C3.10054 9.2433 3.41848 9.375 3.75 9.375H16.25C16.5815 9.375 16.8995 9.2433 17.1339 9.00888C17.3683 8.77446 17.5 8.45652 17.5 8.125V5C17.5 4.66848 17.3683 4.35054 17.1339 4.11612C16.8995 3.8817 16.5815 3.75 16.25 3.75Z" />,
    20 / 24
  ),
  makeIcon(
    "instructions",
    <g transform="scale(0.6 0.6)">
      <g opacity="0.5">
        <path
          d="M8.79453 10.2303C7.1791 10.2303 5.86953 11.5399 5.86953 13.1553V28.9503C5.86953 31.535 7.96484 33.6303 10.5495 33.6303H26.3445C27.96 33.6303 29.2695 32.3208 29.2695 30.7053"
          fill="#F1F1F1"
        />
        <path
          d="M8.79453 10.2303V10.2303C7.1791 10.2303 5.86953 11.5399 5.86953 13.1553V28.9503C5.86953 31.535 7.96484 33.6303 10.5495 33.6303H26.3445C27.96 33.6303 29.2695 32.3208 29.2695 30.7053V30.7053"
          stroke="#D0D0D0"
          stroke-width="1.755"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </g>
      <path
        d="M30.5833 7.50983L16.7506 5.10616C14.204 4.66365 11.7809 6.3693 11.3384 8.91583L8.93475 22.7485C8.49224 25.2951 10.1979 27.7182 12.7444 28.1607L26.5771 30.5644C29.1237 31.0069 31.5468 29.3012 31.9893 26.7547L34.3929 12.922C34.8354 10.3754 33.1298 7.95234 30.5833 7.50983Z"
        fill="white"
        stroke="#EDEDED"
        stroke-width="1.755"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
      <path
        d="M26.079 21.4724L27.4143 13.7876L19.7295 12.4522"
        stroke="#7C7C7C"
        stroke-width="1.872"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
      <path
        d="M16.5899 21.4068L27.4142 13.7875"
        stroke="#7C7C7C"
        stroke-width="1.872"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
    </g>,
    40 / 24
  )
];

type IconName = (typeof iconData)[number]["name"];

export function createIconSet() {
  const iconSet = document.createElement("svg");
  iconSet.id = "xendit-icon-set";
  iconSet.style.display = "none";
  render(<defs>{iconData.map((icon) => icon.node)}</defs>, iconSet);
  return iconSet;
}

export default Icon;
