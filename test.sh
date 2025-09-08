#!/bin/bash

folders="\
api/prisma \
api/src \
" # 列出這些資料夾下面完整的檔案

files="\
Readme.md \
docker-compose.yml \
create_db.sql \
.env \
package.json \
.dockerignore \
Dockerfile \
test.html \
"

# 臨時文件用於存儲所有找到的文件路徑
tmp_file=$(mktemp)

# 根據文件擴展名確定語言高亮設置
get_language_for_extension() {
  local ext=$1
  case "$ext" in
    sql)   echo "sql" ;;
    kt)    echo "kotlin" ;;
    json)  echo "json" ;;
    js)    echo "javascript" ;;
    py)    echo "python" ;;
    java)  echo "java" ;;
    html)  echo "html" ;;
    css)   echo "css" ;;
    xml)   echo "xml" ;;
    md)    echo "markdown" ;;
    sh)    echo "bash" ;;
    c)     echo "c" ;;
    cpp)   echo "cpp" ;;
    go)    echo "go" ;;
    rs)    echo "rust" ;;
    rb)    echo "ruby" ;;
    php)   echo "php" ;;
    ts)    echo "typescript" ;;
    yaml|yml) echo "yaml" ;;
    *)     echo "text" ;;
  esac
}

# 顯示文件內容並使用合適的 markdown 格式
display_file_content() {
  local file=$1
  
  # 如果文件不存在則跳過
  if [ ! -f "$file" ]; then
    echo "警告: 文件 '$file' 未找到。"
    return
  fi
  
  # 獲取文件擴展名用於語言高亮
  local ext="${file##*.}"
  local language=$(get_language_for_extension "$ext")
  
  # 顯示帶有 markdown 格式的文件
  echo "File: $file"
  echo "~~~$language"
  cat "$file"
  echo -e "\n~~~"
  echo
}

# 收集所有文件路徑
collect_files() {
  # 收集個別指定的文件
  IFS=' ' read -ra FILE_ARRAY <<< "$files"
  for file in "${FILE_ARRAY[@]}"; do
    # 使用 find 命令尋找檔案
    found_file=$(find . -type d -name "node_modules" -prune -o -type d -name "generated" -prune -o -name "$file" -type f -print | head -n 1 | sed "s/^\.\///g")
    
    if [ -z "$found_file" ]; then
      echo "警告: 未找到檔案 '$file'。" >&2
      continue
    fi
    
    echo "$found_file" >> "$tmp_file"
  done
  

  # 收集資料夾中的文件
  IFS=' ' read -ra FOLDER_ARRAY <<< "$folders"
  for folder in "${FOLDER_ARRAY[@]}"; do
    if [ ! -d "$folder" ]; then
      echo "警告: 資料夾 '$folder' 未找到。" >&2
      continue
    fi
    
    find "$folder" -type f | sort >> "$tmp_file"
  done
  
  # 對所有收集到的文件進行排序並去重
  # sort -u "$tmp_file" > "${tmp_file}.sorted"
  # mv "${tmp_file}.sorted" "$tmp_file"
}

# 收集所有文件
collect_files

# 清理臨時文件
echo -e "主要檔案:\n~~~"
cat $tmp_file
echo -e "~~~\n"

# 依序顯示文件內容
while read -r file; do
    display_file_content "$file"
done < "$tmp_file"

rm -f "$tmp_file"
