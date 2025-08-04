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

      <div className="flex flex-col gap-4 p-2 text-foreground h-full">
        <div className="flex flex-col gap-2">
          <h2 className="text-md font-medium">Issues found</h2>
          <Accordion type="multiple" className="w-full space-y-2">
            {styleDetails.map((style, index) => {
              const isEmpty = !hasProperties(style);

              return (
                <AccordionItem
                  key={index}
                  value={`item-${index}`}
                  className={cn(
                    "border-none bg-card text-card-foreground",
                    isEmpty && "opacity-70"
                  )}
                >
                  <AccordionTrigger
                    className={cn(
                      "text-destructive px-4",
                      isEmpty && "cursor-not-allowed"
                    )}
                    disabled={isEmpty}
                  >
                    <span className="text-sm font-medium">{style.Name}</span>
                    {isEmpty && (
                      <span className="text-xs text-muted-foreground ml-2 bg-card">
                        (No properties)
                      </span>
                    )}
                  </AccordionTrigger>

                  {!isEmpty && (
                    <AccordionContent>
                      <div className="flex flex-col divide-y divide-border">
                        {Object.entries(style.Properties).map(
                          ([key, value], idx) => (
                            <div key={`${key}-${idx}`} className="py-2 px-4">
                              <div className="text-xs flex justify-between items-center">
                                <span className="text-foreground">{key}:</span>
                                <span className="text-accent-foreground ml-2  rounded-full text-xs px-2">
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
