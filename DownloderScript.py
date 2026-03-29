import os
import time
import requests
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import Select
from selenium.webdriver.chrome.service import Service
from webdriver_manager.chrome import ChromeDriverManager

# --- SETTINGS ---
URL = "https://orissahighcourt.nic.in/vernacular_judgments/"
OUTPUT_DIR = "downloaded_pdfs"

if not os.path.exists(OUTPUT_DIR):
    os.makedirs(OUTPUT_DIR)

def main():
    print("[*] Launching Chrome...")
    options = webdriver.ChromeOptions()
    # options.add_argument("--headless") 
    driver = webdriver.Chrome(service=Service(ChromeDriverManager().install()), options=options)
    
    print(f"[*] Opening {URL}...")
    driver.get(URL)
    
    # 1. CHANGE TO 100 ENTRIES
    print("[*] switching to 100 entries...")
    try:
        # Find the dropdown (matches any name containing 'length')
        dropdown = driver.find_element(By.XPATH, "//select[contains(@name, 'length')]")
        select = Select(dropdown)
        select.select_by_value("100") 
        
        # --- SMART WAIT: Wait until we see more than 10 rows ---
        print("[*] Waiting for table to expand...")
        for _ in range(20): # Try for 20 seconds
            rows = driver.find_elements(By.XPATH, "//table//tbody//tr")
            if len(rows) > 15: # If we have more than the default 10
                print(f"[*] Success! Table expanded to {len(rows)} rows.")
                break
            time.sleep(1)
            
    except Exception as e:
        print(f"[!] Warning: Could not change table size: {e}")

    # 2. CHECK TOTAL COUNT (To see if 30 is actually the maximum)
    try:
        info_text = driver.find_element(By.ID, "dataTable_info").text
        print(f"[*] WEBSITE SAYS: {info_text}") # e.g., "Showing 1 to 50 of 180 entries"
    except:
        print("[*] Could not read total entry count.")

    # 3. SCRAPE
    rows = driver.find_elements(By.XPATH, "//table//tbody//tr")
    print(f"[*] Starting download loop for {len(rows)} files...")

    count = 0
    for i, row in enumerate(rows):
        try:
            cols = row.find_elements(By.TAG_NAME, "td")
            if len(cols) < 6: continue

            # Get Case No (Col 1) and English PDF (Col 5/Index 5)
            case_raw = cols[1].get_attribute("textContent").strip()
            
            # Skip if empty
            if not case_raw: continue

            # Clean Filename
            safe_name = "".join([c if c.isalnum() else "_" for c in case_raw])
            filename = f"{safe_name}.pdf"
            filepath = os.path.join(OUTPUT_DIR, filename)
            
            # Check if file already exists
            if os.path.exists(filepath):
                print(f"[~] Skipping {filename} (Already exists)")
                continue

            # Find Link
            english_col = cols[5]
            pdf_link = english_col.find_element(By.TAG_NAME, "a")
            pdf_url = pdf_link.get_attribute("href")

            if pdf_url:
                print(f"[{count+1}] Downloading: {filename}")
                r = requests.get(pdf_url, stream=True, verify=False)
                with open(filepath, 'wb') as f:
                    for chunk in r.iter_content(chunk_size=8192):
                        f.write(chunk)
                count += 1
                
        except Exception:
            continue

    print(f"\n[*] DONE. Downloaded {count} files.")
    driver.quit()

if __name__ == "__main__":
    import urllib3
    urllib3.disable_warnings()
    main()