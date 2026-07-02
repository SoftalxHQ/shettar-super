import { memo } from "react"

type SvgProps = React.ComponentPropsWithoutRef<"svg">

export const TableIcon = memo(({ className, ...props }: SvgProps) => {
  return (
    <svg
      width="24"
      height="24"
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M4 4C3.44772 4 3 4.44772 3 5V19C3 19.5523 3.44772 20 4 20H20C20.5523 20 21 19.5523 21 19V5C21 4.44772 20.5523 4 20 4H4ZM5 6H9V10H5V6ZM11 6H15V10H11V6ZM17 6H19V10H17V6ZM5 12H9V16H5V12ZM11 12H15V16H11V12ZM17 12H19V16H17V12ZM5 18H9V19H5V18ZM11 18H15V19H11V18ZM17 18H19V19H17V18Z"
        fill="currentColor"
      />
    </svg>
  )
})

TableIcon.displayName = "TableIcon"
