import { createContext } from "preact";
import { ReactNode, useMemo, useState } from "react-dom/src";

interface AccordionContextType {
  selectedItem: string | null;
  setSelectedItem: (itemId: string) => void;
}

export const AccordionContext = createContext<AccordionContextType>({
  selectedItem: null,
  setSelectedItem: () => {}
});

interface AccordionProps {
  children: ReactNode;
}

/**
 * @example
 * <Accordion>
 *   <AccordionItem>Content</AccordionItem>
 *   <AccordionItem>Content</AccordionItem>
 * </Accordion>
 */
export const Accordion: React.FC<AccordionProps> = ({ children }) => {
  const [selectedItem, setSelectedItem] = useState<string | null>(null);

  const contextValue: AccordionContextType = useMemo(() => {
    return {
      selectedItem,
      setSelectedItem: (itemId: string) => {
        if (selectedItem === itemId) {
          setSelectedItem(null); // Deselect if the same item is clicked
        } else {
          setSelectedItem(itemId);
        }
      }
    };
  }, [selectedItem]);

  return (
    <AccordionContext.Provider value={contextValue}>
      <div class="xendit-accordion">{children}</div>
    </AccordionContext.Provider>
  );
};
