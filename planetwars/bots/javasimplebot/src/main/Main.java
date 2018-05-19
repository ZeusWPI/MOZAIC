package main;

import org.json.JSONArray;
import org.json.JSONObject;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.util.ArrayList;
import java.util.List;

public class Main {
    public static void main(String[] args) throws Exception {
        BufferedReader br = new BufferedReader( new InputStreamReader( System.in ) );

        List<JSONObject> myPlanets = new ArrayList<>();
        List<JSONObject> otherPlanets = new ArrayList<>();

        String line = br.readLine();
        while(line != null){
            JSONObject input = new JSONObject(line);
            myPlanets.clear();
            otherPlanets.clear();
            
            JSONArray ps = input.getJSONArray("planets");
            for(int i = 0; i < ps.length(); i++){
                JSONObject p = ps.getJSONObject(i);
                if(p.get("owner") != JSONObject.NULL && p.getInt("owner") == 1) {
                    myPlanets.add(p);
                }else{
                    otherPlanets.add(p);
                }
            }

            if (myPlanets.isEmpty() || otherPlanets.isEmpty()) {
                sendCommand(null);
            }else{
                JSONObject origin = sortOnShipCount(myPlanets).get(0);
                JSONObject dest = sortOnShipCount(otherPlanets).get(otherPlanets.size() - 1);

                JSONObject out = new JSONObject();
                out.put("origin", origin.getString("name"));
                out.put("destination", dest.getString("name"));
                out.put("ship_count", origin.getInt("ship_count") - 1);
                sendCommand(out);
            }

            line = br.readLine();


        }
    }

    private static List<JSONObject> sortOnShipCount(List<JSONObject> in) {
        in.sort((o1, o2) -> {
            try {
                return o1.getInt("ship_count") - o2.getInt("ship_count");
            } catch (Exception e) {
                return 0;
            }
        });
        return in;
    }

    public static void sendCommand(JSONObject move) throws Exception {
        JSONArray moves = new JSONArray();
        if(move != null)
            moves.put(move);

        JSONObject object = new JSONObject();
        object.put("moves", moves);
        System.out.println(object);
    }
}
