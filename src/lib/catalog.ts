import { schema } from "@json-render/vue/schema";
import { z } from "zod";
import { shadcnComponentNames, type ShadcnComponentName } from "./shadcn";

/**
 * Extra named slots (beyond `default`) that a component renders. Specs target
 * these via a top-level `slots` object; everything else lives in `children`.
 */
const namedSlots: Partial<Record<ShadcnComponentName, string[]>> = {
  AccordionTrigger: ["icon"],
  SelectItem: ["indicator-icon"],
  Switch: ["thumb"],
};

/** Human/AI-facing descriptions for the components worth explaining. */
const descriptions: Partial<Record<ShadcnComponentName, string>> = {
  Text: "Inline text. Pass the string via the `text` prop. `variant`: default | muted | small | lead | strong.",
  Heading: "Heading. Pass the string via `text`; `level` (1-4) selects h1-h4.",
  Stack: "Vertical flex container. `gap` is a spacing step (1-8); also accepts `class`.",
  Row: "Horizontal flex container with centered items. `gap`, `wrap`, `class`.",
  Form: "Native <form> wrapper. Bind `on.submit` to run an action on submit (default is prevented). Put a Button with type \"submit\" inside.",
  Icon: "Lucide icon by name. `name`: Trash2 | Eye | Search | Check | X | Plus | RefreshCw | Loader2. Use `class` for size/color.",

  Button: "Button. `variant`: default | destructive | outline | secondary | ghost | link; `size`: default | sm | lg | icon. Put a Text child inside for the label.",
  Card: "Rounded card container. Compose with CardHeader, CardTitle, CardDescription, CardContent, CardFooter.",
  CardHeader: "Card header region.",
  CardTitle: "Card title text region (add a Text child).",
  CardDescription: "Muted card description region (add a Text child).",
  CardContent: "Main card body.",
  CardFooter: "Card footer, usually holds actions.",
  CardAction: "Top-right action slot inside a card header.",

  Input: "Single-line text input. Two-way bind with { \"$bindState\": \"/path\" } on `modelValue`. Bind `on.enter` to run an action when Enter is pressed.",
  Textarea: "Multi-line text input. Bind with `modelValue`. Bind `on.enter` to run an action when Enter is pressed.",
  Label: "Form label (add a Text child).",
  Checkbox: "Checkbox. Bind with `modelValue` (boolean).",
  Switch: "Toggle switch. Bind with `modelValue` (boolean).",
  Slider: "Range slider. Bind with `modelValue` (number).",
  Progress: "Progress bar. Pass `modelValue` (0-100).",
  Select: "Select root. Children: SelectTrigger (with SelectValue) and SelectContent (with SelectItem). Bind with `modelValue`.",
  SelectTrigger: "Opens the select. Put a SelectValue inside.",
  SelectValue: "Displays the selected value; use `placeholder`.",
  SelectContent: "Dropdown panel holding SelectItem children.",
  SelectItem: "Option. Requires a `value`; add a Text child for the label.",
  RadioGroup: "Radio group. Bind with `modelValue`.",
  RadioGroupItem: "Single radio option (`value`).",
  Toggle: "Pressable toggle button.",
  Separator: "Horizontal/vertical divider. `orientation`.",
  Skeleton: "Loading placeholder block.",
  Spinner: "Small animated loading spinner.",

  Table: "Table container. Compose TableHeader > TableRow > TableHead and TableBody > TableRow > TableCell.",
  TableHeader: "Table header section (thead).",
  TableBody: "Table body section (tbody). Supports `repeat` to render one TableRow per state item.",
  TableFooter: "Table footer section.",
  TableRow: "Table row (tr).",
  TableHead: "Header cell (th). Add a Text child.",
  TableCell: "Body cell (td). Add a Text child.",
  TableCaption: "Table caption.",
  TableEmpty: "Empty-state row shown when a table has no rows.",

  Tabs: "Tabs root. Bind with `modelValue`; children: TabsList (with TabsTrigger) and TabsContent.",
  TabsList: "Row of tab triggers.",
  TabsTrigger: "Tab button. Requires a `value`; add a Text child.",
  TabsContent: "Panel shown for a matching tab `value`.",

  Dialog: "Modal dialog root. Bind `open` with { \"$bindState\": \"/path\" }. Children: DialogContent (optionally DialogTrigger).",
  DialogTrigger: "Opens the dialog.",
  DialogContent: "Dialog panel. Put DialogHeader/DialogTitle/DialogDescription and body content inside.",
  DialogHeader: "Dialog heading region.",
  DialogTitle: "Dialog title (add a Text child).",
  DialogDescription: "Dialog description (add a Text child).",
  DialogFooter: "Dialog action region.",
  DialogClose: "Closes the dialog.",
  AlertDialog: "Confirmation dialog root (same shape as Dialog).",
  Sheet: "Slide-over panel root (same shape as Dialog).",
  Popover: "Popover root. Children: PopoverTrigger and PopoverContent.",
  Tooltip: "Tooltip root. Children: TooltipTrigger and TooltipContent.",

  Alert: "Inline alert. `variant`: default | destructive | success. Children: AlertTitle, AlertDescription.",
  AlertTitle: "Alert heading (add a Text child).",
  AlertDescription: "Alert body text.",
  Badge: "Small status pill. `variant`: default | secondary | destructive | outline. Add a Text child.",
  Avatar: "Avatar root. Children: AvatarImage, AvatarFallback.",
  AvatarImage: "Avatar image (`src`, `alt`).",
  AvatarFallback: "Fallback shown when the image fails (add a Text child).",
  Accordion: "Accordion root (`type`: single | multiple, `collapsible`). Children: AccordionItem.",
  AccordionItem: "Accordion section (`value`). Children: AccordionTrigger, AccordionContent.",
  AccordionTrigger: "Accordion header button (add a Text child).",
  AccordionContent: "Accordion panel body.",
  DropdownMenu: "Dropdown root. Children: DropdownMenuTrigger, DropdownMenuContent.",
  DropdownMenuTrigger: "Opens the menu.",
  DropdownMenuContent: "Menu panel holding DropdownMenuItem children.",
  DropdownMenuItem: "Menu entry. Add a Text child; `on.click` fires the action.",
  DropdownMenuLabel: "Menu section label.",
  DropdownMenuSeparator: "Menu divider.",
  Breadcrumb: "Breadcrumb root. Compose BreadcrumbList > BreadcrumbItem > BreadcrumbLink/BreadcrumbPage.",
  Pagination: "Pagination root. Compose PaginationContent > PaginationItem with PaginationPrevious/Next.",
};

const components = Object.fromEntries(
  shadcnComponentNames.map((name) => [
    name,
    {
      props: z.object({}).passthrough(),
      slots: ["default", ...(namedSlots[name] ?? [])],
      description: descriptions[name] ?? `shadcn-vue ${name} component.`,
    },
  ]),
);

export const catalog = schema.createCatalog({
  components,
  actions: {
    fetchData: {
      params: z.object({
        url: z.string(),
        method: z.enum(["GET", "POST", "PUT", "PATCH", "DELETE"]).optional(),
        headers: z.record(z.string(), z.string()).optional(),
        body: z.unknown().optional(),
        statePath: z.string().optional(),
        loadingPath: z.string().optional(),
        errorPath: z.string().optional(),
        successPath: z.string().optional(),
        jsonPath: z.string().optional(),
      }),
      description:
        "Call an HTTP endpoint. Stores the parsed response at statePath, a pretty-printed JSON string at jsonPath, toggles loadingPath while pending, and writes the error message to errorPath on failure. Sets successPath to true on a successful response.",
    },
  },
});

export type AppCatalog = typeof catalog;
