import { ComponentChildren, FunctionComponent } from "preact";

interface Props {
  children: ComponentChildren;
}

/**
 * @example
 * <Accordion>
 *   <AccordionItem>Content</AccordionItem>
 *   <AccordionItem>Content</AccordionItem>
 * </Accordion>
 */
export const Accordion: FunctionComponent<Props> = (props) => {
  return <div class="xendit-accordion">{props.children}</div>;
};
