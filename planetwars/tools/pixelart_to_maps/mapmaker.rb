require 'chunky_png'
require 'json'

spacing = 3
filename = 'dickbutt'

png = ChunkyPNG::Image.from_file("#{filename}.png")

planets = png.pixels.each_with_index.map {|e, i| [e, i % png.width, i / png.width] }.select {|e, _, _| e != ChunkyPNG::Color::WHITE }
planets.map! {|e, x, y| {name: "PIET#{x}+#{y}", x: spacing * x, y: spacing * y, ship_count: 6}}
planets.sample(2).each_with_index { |e, i| e.merge!(owner: i + 1) }

File.write("#{filename}.json", { planets: planets }.to_json)
