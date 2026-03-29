from selenium import webdriver
from selenium.webdriver.common.by import By

driver = webdriver.Chrome()
driver.get("https://orissahighcourt.nic.in/vernacular_judgments/")
tables = driver.find_elements(By.TAG_NAME, "table")
for i, t in enumerate(tables):
    print(f"Table {i}: ID='{t.get_attribute('id')}' | Class='{t.get_attribute('class')}'")
driver.quit()