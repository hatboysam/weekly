require 'json'

# dev or prod
mode = ""

# Decide if we are going to prod or dev 
ARGV.each do |arg|
  mode = arg
  puts "Switching mobile to: #{mode}"
end

# Read the file
manifest_file = File.open('www/manifest.mobile.json', 'rb')
manifest_contents = manifest_file.read
manifest_file.close

# Convert to JSON
manifest_json = JSON.parse(manifest_contents)

# Change the client_id
if mode == 'dev'
  # Put in development client_id for android
  puts 'Changing Client ID'
  dev_id = '891667400722-4jj4mqolqporeemn9l0svij94ncsrhhg.apps.googleusercontent.com'
  manifest_json['android']['oauth2']['client_id'] = dev_id
else
  # Put in production client_id for android
  puts 'Changing Client ID'
  prod_id = '8891667400722-t4343sf2pgkql45qnhb90pv7fl24r93t.apps.googleusercontent.com'
  manifest_json['android']['oauth2']['client_id'] = prod_id
end

# Pretty print and overwrite file
puts 'Writing file...'
new_json = JSON.pretty_generate(manifest_json)
manifest_file = File.open('www/manifest.mobile.json', 'w')
manifest_file.write(new_json)
manifest_file.close
puts 'Done.'