interface Props {
  children: React.ReactNode;
}

/**
 * @example
 * <Accordion>
 *   <AccordionItem>Content</AccordionItem>
 *   <AccordionItem>Content</AccordionItem>
 * </Accordion>
 */
export const Accordion: React.FC<Props> = (props) => {
  return <div class="xendit-accordion">{props.children}</div>;
};
