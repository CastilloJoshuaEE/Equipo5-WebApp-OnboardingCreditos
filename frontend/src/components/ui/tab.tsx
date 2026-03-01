// frontend/src/components/ui/tab.tsx
import React from "react";
import Box from "@mui/material/Box";
export interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}
export default function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`documentos-tabpanel-${index}`}
      aria-labelledby={`documentos-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ py: { xs: 2, md: 3 } }}>
          {children}
        </Box>
      )}
    </div>
  );
}