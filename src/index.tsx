import "./styles/globals.css";
import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom/client";
import Header from "./components/Header";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "./components/ui/accordion";
import { cn } from "@/lib/utils";

const App: React.FC = () => {
  const [styleDetails, setStyleDetails] = useState<any[]>([]);

  useEffect(() => {
    const unsubscribe = webflow.subscribe(
      "selectedelement",
      async (element: AnyElement | null) => {
        if (!element) {
          setStyleDetails([]);
          return;
        }
        if (element.styles) {
          const styles = await element.getStyles();
          const details = await Promise.all(
            styles.map(async (style) => ({
              Name: await style.getName(),
              Properties: await style.getProperties(),
              ID: style.id,
            }))
          );
          setStyleDetails(details);
        } else {
          setStyleDetails([]);
        }
      }
    );

    return () => unsubscribe();
  }, []);

  // Helper function to check if style has properties
  const hasProperties = (style: any) => {
    return style.Properties && Object.keys(style.Properties).length > 0;
  };

  return (
    <div className="">
      <Header />

      <div className="p-2 text-foreground h-full">
        <div className="flex flex-col gap-2">
          <h2 className="text-md text-red-500">Issues found</h2>
          <Accordion type="multiple" className="w-full">
            {styleDetails.map((style, index) => {
              const isEmpty = !hasProperties(style);

              return (
                <AccordionItem
                  key={index}
                  value={`item-${index}`}
                  className={cn("border-none bg-card")}
                >
                  <AccordionTrigger
                    className={cn(
                      "font-normal py-2",
                      isEmpty
                        ? "text-muted-foreground cursor-not-allowed"
                        : "text-primary"
                    )}
                    disabled={isEmpty}
                  >
                    <span className="text-xs font-medium w-2/3">
                      {style.Name}
                    </span>
                    {isEmpty && (
                      <span className="text-xs text-muted-foreground bg-card w-1/3 text-right">
                        <span className="text-muted">No properties</span>
                      </span>
                    )}
                  </AccordionTrigger>

                  {!isEmpty && (
                    <AccordionContent>
                      <div className="flex flex-col divide-y divide-border">
                        {Object.entries(style.Properties).map(
                          ([key, value], idx) => (
                            <div key={`${key}-${idx}`} className="py-2">
                              <div className="text-xs flex justify-between">
                                <span className="text-foreground">{key}:</span>
                                <span className="text-accent-foreground rounded-full text-xs">
                                  {String(value)}
                                </span>
                              </div>
                            </div>
                          )
                        )}
                      </div>
                    </AccordionContent>
                  )}
                </AccordionItem>
              );
            })}
          </Accordion>
          {styleDetails.length === 0 && (
            <div className="text-center py-4 text-muted-foreground text-sm">
              Select an element to view style details
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const root = ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement
);
root.render(<App />);
